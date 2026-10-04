// backend/routes/paymentRoutes.js
// All payment confirmation happens HERE, server-to-provider. The client never marks anything paid.
//
// Reliability model (slow networks, closed tabs, double clicks, lost responses):
//   - Every payment attempt (GCash session / PayPal order) is REMEMBERED on the checkout in
//     paymentDetails.attempts, so paying in an older tab still counts.
//   - Every check is SAFE TO REPEAT: markCheckoutPaid + finalizeCheckout are idempotent, so the
//     return page, retries, webhook and reconcile can all run without ever creating two orders.
//   - POST /reconcile re-checks a customer's unpaid checkouts with the providers and completes
//     any that were actually paid (e.g. customer paid, then closed the tab). My Orders calls it.
//
// PayPal:  POST /paypal/create-order  ->  (buyer approves)  ->  POST /paypal/capture
// GCash:   POST /gcash/create-session ->  (buyer pays)      ->  GET /gcash/verify/:id  (+ webhook)
const express = require("express");
const mongoose = require("mongoose");
const Checkout = require("../models/Checkout");
const { protect } = require("../middleware/authMiddleware");
const { priceItems, repriceCheckout, PricingError } = require("../services/pricingService");
const { markCheckoutPaid, finalizeCheckout } = require("../services/orderService");
const paymongo = require("../utils/paymongo");
const { cleanName, toPhMobileLocal } = require("../utils/formatContact");
const paypal = require("../utils/paypal");

const router = express.Router();

const MAX_ATTEMPTS_KEPT = 10;
const RECONCILE_WINDOW_DAYS = 7;
const RECONCILE_MAX_CHECKOUTS = 5;
const RECONCILE_MIN_INTERVAL_MS = 20 * 1000; // don't hammer providers for the same checkout

const frontendUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

// Load a checkout that belongs to the logged-in user, or send 404 and return null
const loadOwnCheckout = async (req, res, checkoutId) => {
  if (!mongoose.Types.ObjectId.isValid(String(checkoutId || ""))) {
    res.status(400).json({ message: "Valid checkoutId is required" });
    return null;
  }
  const checkout = await Checkout.findById(checkoutId);
  if (!checkout || String(checkout.user) !== String(req.user._id)) {
    res.status(404).json({ message: "Checkout not found" });
    return null;
  }
  return checkout;
};

const isDev = () => process.env.NODE_ENV !== "production"; // checked per request

// One readable line per provider error, e.g.
//   [GCash] PayMongo 400: The value for billing.phone is invalid. (billing.phone)
const describeProviderError = (error) => {
  const pm = error.paymongo?.errors;
  if (Array.isArray(pm) && pm.length) {
    const parts = pm.map((e) => `${e.detail || e.code}${e.source?.pointer ? ` (${e.source.pointer})` : ""}`);
    return `PayMongo ${error.status}: ${parts.join("; ")}`;
  }
  if (error.paypal) {
    const d = error.paypal.details?.[0];
    return `PayPal ${error.status}: ${error.paypal.name || ""} ${d ? `${d.issue} - ${d.description || ""}` : error.paypal.message || ""}`.trim();
  }
  return error.message;
};

const sendError = (res, error, fallback) => {
  if (error instanceof PricingError) {
    return res.status(400).json({ message: error.message });
  }
  const detail = describeProviderError(error);
  console.error(`[${fallback}] ${detail}`);
  // Provider errors are for server logs, not customers — but show them while developing
  return res.status(500).json(isDev() ? { message: fallback, detail } : { message: fallback });
};

/* =========================================================================
 * PAYMENT ATTEMPTS (shared)
 * ========================================================================= */

// All attempts for this checkout's provider, oldest first.
// Also understands the older single-attempt format (checkoutSessionId / paypalOrderId).
const attemptsOf = (checkout, provider) => {
  const d = checkout.paymentDetails || {};
  if (d.provider !== provider) return [];
  const list = Array.isArray(d.attempts) ? [...d.attempts] : [];
  const legacyId = d.checkoutSessionId || d.paypalOrderId;
  if (legacyId && !list.some((a) => a.id === legacyId)) {
    list.unshift({ id: legacyId, amount: d.expectedAmount });
  }
  return list;
};

// Remember a new attempt (keeps earlier ones so older tabs still count)
const recordAttempt = (checkout, provider, attempt, extra = {}) => {
  const previous = attemptsOf(checkout, provider);
  checkout.paymentDetails = {
    provider,
    ...extra,
    attempts: [...previous, { ...attempt, createdAt: new Date() }].slice(-MAX_ATTEMPTS_KEPT),
  };
  checkout.paymentStatus = "awaiting_payment";
};

const completeCheckout = async (checkout, details) => {
  // Keep the attempt list: late or repeated webhooks must still find this checkout
  const attempts = checkout.paymentDetails?.attempts;
  await markCheckoutPaid(checkout._id, { ...details, ...(attempts ? { attempts } : {}) });
  return finalizeCheckout(checkout._id);
};

/* =========================================================================
 * PAYPAL
 * ========================================================================= */

// Validate a PayPal order against the attempt WE created. Returns { ok, capture } or { ok:false, reason }
const checkPaypalOrder = (checkout, paypalOrder, attempt) => {
  const completed = paypal.getCompletedCapture(paypalOrder);
  if (!completed) return { ok: false, reason: "not_completed" };
  const { unit, capture } = completed;
  const amountOk = capture.amount?.currency_code === "PHP" && capture.amount?.value === attempt.amount;
  const referenceOk = String(unit.reference_id || capture.custom_id || "") === String(checkout._id);
  if (!amountOk || !referenceOk) return { ok: false, reason: "mismatch", capture, unit };
  return { ok: true, capture };
};

const paypalDetails = (paypalOrder, capture) => ({
  provider: "paypal",
  paypalOrderId: paypalOrder.id,
  captureId: capture.id,
  amount: capture.amount.value,
  currency: capture.amount.currency_code,
  payerId: paypalOrder.payer?.payer_id,
  payerEmail: paypalOrder.payer?.email_address,
  capturedAt: capture.create_time,
});

const flagForReview = async (checkout, info) => {
  console.error("PAYMENT NEEDS REVIEW", { checkoutId: String(checkout._id), ...info });
  await Checkout.updateOne(
    { _id: checkout._id, isPaid: false },
    { $set: { paymentStatus: "review_required", "paymentDetails.review": info } }
  );
};

// @route POST /api/payments/paypal/create-order
// @access Private (owner)
router.post("/paypal/create-order", protect, async (req, res) => {
  try {
    const checkout = await loadOwnCheckout(req, res, req.body.checkoutId);
    if (!checkout) return;

    if (checkout.isPaid) {
      const order = await finalizeCheckout(checkout._id);
      return res.status(409).json({ message: "This order is already paid", status: "paid", order });
    }

    await repriceCheckout(checkout); // prices may have changed

    const paypalOrder = await paypal.createOrder({
      checkoutId: checkout._id,
      amount: checkout.totalPrice,
      currency: "PHP",
    });

    checkout.paymentMethod = "PayPal";
    recordAttempt(checkout, "paypal", { id: paypalOrder.id, amount: paypal.formatAmount(checkout.totalPrice) }, { currency: "PHP" });
    await checkout.save();

    res.status(201).json({ id: paypalOrder.id, totalPrice: checkout.totalPrice });
  } catch (error) {
    sendError(res, error, "Unable to start PayPal payment");
  }
});

// @route POST /api/payments/paypal/capture
// @desc  Safe to call repeatedly (the frontend retries on slow/dropped connections)
// @access Private (owner)
router.post("/paypal/capture", protect, async (req, res) => {
  const { checkoutId, orderID } = req.body;

  try {
    const checkout = await loadOwnCheckout(req, res, checkoutId);
    if (!checkout) return;

    // Already handled (retry after a lost response, double click) -> return the order
    if (checkout.isPaid) {
      const order = await finalizeCheckout(checkout._id);
      return res.json({ status: "paid", order });
    }

    // The PayPal order must be one WE created for THIS checkout
    const attempt = attemptsOf(checkout, "paypal").find((a) => a.id === orderID);
    if (!orderID || !attempt) {
      return res.status(400).json({ message: "PayPal order does not match this checkout" });
    }

    // Was it already captured by an earlier attempt whose response got lost?
    let paypalOrder = await paypal.getOrder(orderID).catch(() => null);

    if (paypalOrder?.status !== "COMPLETED") {
      // Last stock check BEFORE money moves. If something sold out, don't capture —
      // the approved PayPal order simply expires and the buyer isn't charged.
      try {
        await priceItems(checkout.checkoutItems, { checkStock: true });
      } catch (error) {
        if (error instanceof PricingError) {
          return res.status(409).json({ message: `${error.message}. You have not been charged.` });
        }
        throw error;
      }

      try {
        paypalOrder = await paypal.captureOrder(orderID);
      } catch (error) {
        if (error.issue === "ORDER_ALREADY_CAPTURED") {
          paypalOrder = await paypal.getOrder(orderID);
        } else if (error.status === 422) {
          // e.g. INSTRUMENT_DECLINED — buyer can retry with another funding source
          return res.status(402).json({ message: "Payment was declined by PayPal", issue: error.issue });
        } else {
          throw error;
        }
      }
    }

    const result = checkPaypalOrder(checkout, paypalOrder, attempt);
    if (!result.ok) {
      if (result.reason === "mismatch") {
        await flagForReview(checkout, { provider: "paypal", orderID, got: result.capture?.amount, expected: attempt.amount });
        return res.status(409).json({ message: "Payment amount mismatch. Our team will review it." });
      }
      return res.status(402).json({ message: "PayPal payment not completed" });
    }

    const order = await completeCheckout(checkout, paypalDetails(paypalOrder, result.capture));
    res.json({ status: "paid", order });
  } catch (error) {
    sendError(res, error, "Unable to confirm PayPal payment");
  }
});

/* =========================================================================
 * GCASH (PayMongo)
 *
 * New payments use the DIRECT flow (Payment Intent): the customer goes straight to GCash,
 * with no PayMongo "choose a payment method" page. Attempt ids start with "pi_".
 * Hosted-checkout sessions created before this change ("cs_") are still verified,
 * reconciled and accepted from webhooks, so no earlier payment is ever lost.
 * ========================================================================= */

const isIntentId = (id) => String(id || "").startsWith("pi_");

const findGcashAttempt = (checkout, id) => attemptsOf(checkout, "paymongo").find((a) => a.id === id);

// Without pass-on-fees `amount` equals our total; with it, `net_amount` does.
const amountMatches = (attempt, payment) => {
  const { amount, net_amount: netAmount } = payment?.attributes || {};
  return attempt.amount === undefined || amount === undefined || amount === attempt.amount || netAmount === attempt.amount;
};

// Hosted-checkout session (older flow)
const sessionPaymentMatches = (checkout, session, payment) => {
  const attempt = findGcashAttempt(checkout, session?.id);
  return !!attempt && String(session?.attributes?.reference_number) === String(checkout._id) && amountMatches(attempt, payment);
};

// Payment Intent (direct flow)
const intentPaymentMatches = (checkout, intentId, payment, intent) => {
  const attempt = findGcashAttempt(checkout, intentId);
  const metaCheckout = intent?.attributes?.metadata?.checkoutId;
  if (metaCheckout && String(metaCheckout) !== String(checkout._id)) return false;
  return !!attempt && amountMatches(attempt, payment);
};

const sessionDetails = (session, payment) => ({
  provider: "paymongo",
  method: "gcash",
  checkoutSessionId: session.id,
  paymentId: payment?.id,
  amount: payment?.attributes?.amount,
  currency: payment?.attributes?.currency,
  paidAt: payment?.attributes?.paid_at,
  livemode: session?.attributes?.livemode,
});

const intentDetails = (intentId, payment, intent) => ({
  provider: "paymongo",
  method: "gcash",
  paymentIntentId: intentId,
  paymentId: payment?.id,
  amount: payment?.attributes?.amount ?? intent?.attributes?.amount,
  currency: payment?.attributes?.currency || "PHP",
  paidAt: payment?.attributes?.paid_at,
  livemode: intent?.attributes?.livemode ?? payment?.attributes?.livemode,
});

/**
 * Ask PayMongo about every GCash attempt of this checkout (newest first).
 * Returns { paid: {details} } or { active, unknown, processing, newestFailed }:
 *   active       = newest still-payable attempt { attempt, redirectUrl } (for reuse)
 *   unknown      = an attempt couldn't be fetched (network) — never claim "expired" then
 *   processing   = PayMongo is still finalizing a payment
 *   newestFailed = the latest attempt was declined/failed in GCash
 */
const inspectGcashAttempts = async (checkout) => {
  const attempts = attemptsOf(checkout, "paymongo").reverse();
  const result = { active: null, unknown: false, processing: false, newestFailed: false };

  for (const [index, attempt] of attempts.entries()) {
    const intentFlow = isIntentId(attempt.id);
    const resource = await (intentFlow
      ? paymongo.retrievePaymentIntent(attempt.id)
      : paymongo.retrieveCheckoutSession(attempt.id)
    ).catch((error) => {
      console.warn(`[GCash] could not fetch ${attempt.id}: ${describeProviderError(error)}`);
      return null;
    });
    if (!resource) {
      result.unknown = true;
      continue;
    }

    const attrs = resource.attributes || {};
    if (intentFlow) {
      const payment = paymongo.getPaidPaymentFromIntent(resource);
      if (payment) {
        if (intentPaymentMatches(checkout, attempt.id, payment, resource)) {
          return { paid: { details: intentDetails(attempt.id, payment, resource) } };
        }
        await flagForReview(checkout, { provider: "paymongo", intentId: attempt.id, reason: "paid intent did not match" });
        continue;
      }
      if (attrs.status === "processing") result.processing = true;
      if (attrs.status === "awaiting_next_action" && !result.active) {
        result.active = { attempt, redirectUrl: paymongo.getRedirectUrl(resource) };
      }
      // Failed attempt on the newest intent. PayMongo may either reset the intent
      // (awaiting_payment_method + last_payment_error) or keep it open for a retry with the
      // failed payment listed — seen in testing: fail, then authorize on the same intent.
      const hasFailedPayment = (attrs.payments || []).some((pm) => pm?.attributes?.status === "failed");
      if (
        index === 0 &&
        ((attrs.status === "awaiting_payment_method" && attrs.last_payment_error) || hasFailedPayment)
      ) {
        result.newestFailed = true;
      }
    } else {
      const payment = paymongo.getPaidPayment(resource);
      if (payment) {
        if (sessionPaymentMatches(checkout, resource, payment)) {
          return { paid: { details: sessionDetails(resource, payment) } };
        }
        await flagForReview(checkout, { provider: "paymongo", sessionId: attempt.id, reason: "paid session did not match" });
        continue;
      }
      if (attrs.status === "active" && !result.active) {
        result.active = { attempt, redirectUrl: attrs.checkout_url };
      }
    }
  }
  return result;
};

// @route POST /api/payments/gcash/create-session
// @desc  Start (or resume) a GCash payment. Returns checkoutUrl = GCash authorization page.
//        (Route name kept for the frontend; it now uses the direct Payment Intent flow.)
// @access Private (owner)
router.post("/gcash/create-session", protect, async (req, res) => {
  const { checkoutId, billing = {} } = req.body;

  const configProblem = paymongo.secretKeyProblem(); // catches pk_, masked, placeholder keys
  if (configProblem) {
    console.error(`[GCash] ${configProblem}`);
    return res.status(503).json(
      isDev() ? { message: "GCash is not configured", detail: configProblem } : { message: "GCash is temporarily unavailable" }
    );
  }

  try {
    const checkout = await loadOwnCheckout(req, res, checkoutId);
    if (!checkout) return;

    if (checkout.isPaid) {
      const order = await finalizeCheckout(checkout._id);
      return res.json({ status: "paid", order });
    }

    // Clicked Pay again (went Back, second tab, retry)? Check earlier attempts FIRST.
    const existing = await inspectGcashAttempts(checkout);
    if (existing.paid) {
      // Already paid in an earlier attempt — finish that order, never charge twice
      const order = await completeCheckout(checkout, existing.paid.details);
      return res.json({ status: "paid", order });
    }
    if (existing.processing) {
      return res.status(409).json({
        message: "Your previous GCash payment is still processing. Please wait a moment and check My Orders.",
      });
    }

    await repriceCheckout(checkout);

    // PayMongo/GCash limits: clear message instead of a raw API error
    const totalCentavos = paymongo.toCentavos(checkout.totalPrice);
    if (totalCentavos < paymongo.GCASH_MIN_CENTAVOS) {
      return res.status(400).json({ message: "GCash payments must be at least ₱20.00" });
    }
    if (totalCentavos > paymongo.GCASH_MAX_CENTAVOS) {
      return res.status(400).json({
        message: "GCash payments are limited to ₱100,000. Please use PayPal for this order.",
      });
    }

    // Clean name ("Jhon  Cedric " -> "Jhon Cedric"); phone in local format (09XXXXXXXXX),
    // invalid numbers left out (phone is optional)
    const phone = toPhMobileLocal(billing.phone);
    const billingInfo = {
      name: cleanName(billing.name) || cleanName(req.user.name),
      email: req.user.email,
      ...(phone ? { phone } : {}),
    };
    const billingKey = JSON.stringify(billingInfo);

    // Resume the still-open GCash authorization if amount and details are unchanged
    const open = existing.active;
    if (
      open &&
      isIntentId(open.attempt.id) &&
      open.attempt.amount === totalCentavos &&
      open.attempt.billingKey === billingKey &&
      open.redirectUrl
    ) {
      await checkout.save(); // persists repriced items (unchanged total)
      return res.json({ checkoutUrl: open.redirectUrl, intentId: open.attempt.id, totalPrice: checkout.totalPrice, reused: true });
    }

    // 1. Payment Intent (GCash only)
    const intent = await paymongo.createGcashPaymentIntent({
      amountCentavos: totalCentavos,
      description: `GrayScale order ${checkout._id}`,
      metadata: { checkoutId: String(checkout._id), userId: String(req.user._id) },
    });

    // Remember it immediately, so it's tracked even if a later step fails
    checkout.paymentMethod = "GCash";
    recordAttempt(checkout, "paymongo", { id: intent.id, amount: totalCentavos, billingKey }, { method: "gcash" });
    await checkout.save();

    // 2. GCash payment method  3. attach -> GCash authorization URL
    const paymentMethod = await paymongo.createGcashPaymentMethod(billingInfo);
    const attached = await paymongo.attachPaymentIntent({
      intentId: intent.id,
      paymentMethodId: paymentMethod.id,
      clientKey: intent.attributes?.client_key,
      returnUrl: `${frontendUrl()}/payment/gcash/return?checkoutId=${checkout._id}`,
    });

    const redirectUrl = paymongo.getRedirectUrl(attached);
    if (!redirectUrl) {
      const status = attached?.attributes?.status;
      const reason = attached?.attributes?.last_payment_error?.failed_message;
      throw new Error(`PayMongo did not return a GCash redirect (status: ${status}${reason ? `, ${reason}` : ""})`);
    }

    res.status(201).json({ checkoutUrl: redirectUrl, intentId: intent.id, totalPrice: checkout.totalPrice });
  } catch (error) {
    sendError(res, error, "Unable to start GCash payment");
  }
});

// @route GET /api/payments/gcash/verify/:checkoutId
// @desc  Called by the return page (and retried on slow connections). Safe to repeat.
// @access Private (owner)
router.get("/gcash/verify/:checkoutId", protect, async (req, res) => {
  try {
    const checkout = await loadOwnCheckout(req, res, req.params.checkoutId);
    if (!checkout) return;

    if (checkout.isPaid) {
      const order = await finalizeCheckout(checkout._id);
      return res.json({ status: "paid", order });
    }

    if (attemptsOf(checkout, "paymongo").length === 0) {
      return res.status(400).json({ message: "No GCash payment for this checkout" });
    }

    const result = await inspectGcashAttempts(checkout);
    if (result.paid) {
      const order = await completeCheckout(checkout, result.paid.details);
      return res.json({ status: "paid", order });
    }
    // Only a definite answer from PayMongo counts as failed/expired
    if (result.unknown || result.processing) return res.json({ status: "pending" });
    if (result.newestFailed) return res.json({ status: "failed" }); // retry resumes the same GCash page if still open
    if (result.active) return res.json({ status: "pending" });
    res.json({ status: "expired" });
  } catch (error) {
    sendError(res, error, "Unable to verify GCash payment");
  }
});

/* =========================================================================
 * RECONCILE — recover payments whose confirmation never arrived
 * ========================================================================= */

// Check one unpaid checkout with its provider. Returns the Order if it turned out to be paid.
const reconcileCheckout = async (checkout) => {
  // Paid but order creation was interrupted (e.g. server restarted mid-way)
  if (checkout.isPaid) return finalizeCheckout(checkout._id);

  const provider = checkout.paymentDetails?.provider;
  if (provider === "paymongo") {
    if (paymongo.secretKeyProblem()) return null;
    const result = await inspectGcashAttempts(checkout);
    return result.paid ? completeCheckout(checkout, result.paid.details) : null;
  }

  if (provider === "paypal") {
    // Only COMPLETED (captured) PayPal orders are finished here. An approved-but-uncaptured
    // order means no money moved; it simply expires.
    for (const attempt of attemptsOf(checkout, "paypal").reverse()) {
      const paypalOrder = await paypal.getOrder(attempt.id).catch(() => null);
      if (paypalOrder?.status !== "COMPLETED") continue;
      const result = checkPaypalOrder(checkout, paypalOrder, attempt);
      if (result.ok) return completeCheckout(checkout, paypalDetails(paypalOrder, result.capture));
      if (result.reason === "mismatch") {
        await flagForReview(checkout, { provider: "paypal", orderID: attempt.id, got: result.capture?.amount, expected: attempt.amount });
      }
    }
  }
  return null;
};

// @route POST /api/payments/reconcile
// @desc  Re-check this customer's recent unpaid checkouts. Called by My Orders; safe to repeat.
// @access Private
router.post("/reconcile", protect, async (req, res) => {
  try {
    const since = new Date(Date.now() - RECONCILE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const checkedBefore = new Date(Date.now() - RECONCILE_MIN_INTERVAL_MS);

    const candidates = await Checkout.find({
      user: req.user._id,
      updatedAt: { $gte: since },
      $or: [
        { isPaid: true, isFinalized: false },
        {
          isPaid: false,
          paymentStatus: "awaiting_payment",
          $or: [
            { "paymentDetails.lastCheckedAt": { $exists: false } },
            { "paymentDetails.lastCheckedAt": { $lt: checkedBefore } },
          ],
        },
      ],
    })
      .sort({ updatedAt: -1 })
      .limit(RECONCILE_MAX_CHECKOUTS);

    const recovered = [];
    for (const checkout of candidates) {
      // Mark as checked first so parallel calls don't all hit the providers
      // (updateOne, not save: doesn't bump updatedAt, so the 7-day window stays accurate)
      await Checkout.updateOne(
        { _id: checkout._id },
        { $set: { "paymentDetails.lastCheckedAt": new Date() } },
        { timestamps: false }
      );
      try {
        const order = await reconcileCheckout(checkout);
        if (order) recovered.push(order);
      } catch (error) {
        console.warn(`[reconcile] ${checkout._id}: ${describeProviderError(error)}`);
      }
    }

    if (recovered.length) {
      console.log(`[reconcile] recovered ${recovered.length} paid order(s) for user ${req.user._id}`);
    }
    res.json({ checked: candidates.length, recovered });
  } catch (error) {
    sendError(res, error, "Unable to check pending payments");
  }
});

/* =========================================================================
 * PAYMONGO WEBHOOK
 * ========================================================================= */

// @route POST /api/payments/paymongo/webhook
// @desc  RAW body — registered in server.js before express.json
// @access Public (signature-verified)
const webhookHandler = async (req, res) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";

  // Parsing a COPY of the body is safe — the signature is checked against the raw bytes.
  // We need `livemode` from the body to know whether to compare the te or li signature.
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ message: "Invalid JSON" });
  }

  const event = paymongo.parseWebhookEvent(body);
  const livemode = event ? event.livemode : false;

  if (!paymongo.verifyWebhookSignature(rawBody, req.get("paymongo-signature"), livemode)) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  if (!event) {
    console.warn("PayMongo webhook: unrecognized payload shape");
    return res.status(200).json({ received: true });
  }

  // A test-mode event must never create an order on a live store (and vice versa)
  if (event.livemode !== paymongo.isLiveKey()) {
    console.warn(`PayMongo webhook: ignored ${event.livemode ? "live" : "test"}-mode event on ${paymongo.isLiveKey() ? "live" : "test"} keys`);
    return res.status(200).json({ received: true, ignored: "mode_mismatch" });
  }

  const HANDLED = ["payment.paid", "payment.failed", "checkout_session.payment.paid"];
  if (!HANDLED.includes(event.type)) {
    return res.status(200).json({ received: true, ignored: event.type });
  }

  try {
    if (event.type === "payment.failed") {
      // Nothing to change: the checkout stays unpaid and the customer can retry
      console.log(`[GCash] payment failed for intent ${event.resource?.attributes?.payment_intent_id || "?"}`);
      return res.status(200).json({ received: true });
    }

    let checkout = null;
    let attemptId = null;
    let payment = null;
    let details = null;
    let matches = false;

    if (event.type === "payment.paid") {
      // Direct flow: the resource is the Payment; it names its Payment Intent
      payment = event.resource;
      attemptId = payment?.attributes?.payment_intent_id;
      if (attemptId) {
        checkout = await Checkout.findOne({
          $or: [{ "paymentDetails.attempts.id": attemptId }, { "paymentDetails.paymentIntentId": attemptId }],
        });
      }
      if (checkout) {
        matches = intentPaymentMatches(checkout, attemptId, payment);
        details = intentDetails(attemptId, payment);
      }
    } else {
      // Older hosted-checkout sessions
      const session = event.resource;
      attemptId = session?.id;
      const checkoutId = session?.attributes?.metadata?.checkoutId || session?.attributes?.reference_number;
      checkout =
        mongoose.Types.ObjectId.isValid(String(checkoutId || "")) && (await Checkout.findById(checkoutId));
      payment = paymongo.getPaidPayment(session);
      if (checkout && payment) {
        matches = sessionPaymentMatches(checkout, session, payment);
        details = sessionDetails(session, payment);
      }
    }

    if (!checkout) {
      console.warn(`PayMongo webhook: no checkout for ${attemptId || "(unknown)"}`);
    } else if (!matches) {
      console.error("PayMongo webhook: payment mismatch", { checkoutId: String(checkout._id), attemptId });
    } else if (
      checkout.isPaid &&
      ![checkout.paymentDetails?.paymentIntentId, checkout.paymentDetails?.checkoutSessionId].includes(attemptId)
    ) {
      // Paid TWICE (e.g. two tabs both authorized). Keep the first order; flag this one for a refund.
      console.error(`DUPLICATE PAYMENT — refund needed: checkout ${checkout._id}, ${attemptId}, payment ${payment?.id}`);
      await Checkout.updateOne(
        { _id: checkout._id },
        { $addToSet: { "paymentDetails.duplicatePayments": { attemptId, paymentId: payment?.id, amount: payment?.attributes?.amount } } }
      );
    } else {
      await completeCheckout(checkout, details); // idempotent: safe on PayMongo retries
    }

    // 2xx + JSON within 30s = delivered (PayMongo retries up to 12 times otherwise)
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("PayMongo webhook error:", error);
    res.status(500).json({ message: "Webhook processing failed" }); // PayMongo will retry
  }
};

module.exports = { router, webhookHandler };