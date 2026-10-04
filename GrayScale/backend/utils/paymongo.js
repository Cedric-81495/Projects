// backend/utils/paymongo.js
// Thin PayMongo client (uses Node 18+ native fetch, no axios needed)
const crypto = require("crypto");

const PAYMONGO_API = "https://api.paymongo.com/v1";

// Strip whitespace and accidental quotes that often sneak in when copying keys
const getSecretKey = () =>
  String(process.env.PAYMONGO_SECRET_KEY || "").trim().replace(/^["']|["']$/g, "").trim();

// Returns a human-readable problem with the configured key, or null if it looks right.
// Catches the common copy/paste mistakes BEFORE PayMongo answers with a vague 401.
const secretKeyProblem = () => {
  const key = getSecretKey();
  if (!key) return "PAYMONGO_SECRET_KEY is not set in backend/.env (restart after adding it)";
  if (key.startsWith("pk_"))
    return "PAYMONGO_SECRET_KEY is a PUBLIC key (pk_...). Copy the SECRET key (sk_test_...) instead";
  if (!/^sk_(test|live)_/.test(key)) return "PAYMONGO_SECRET_KEY must start with sk_test_ or sk_live_";
  if (/[•*]|\.\.\.|x{6,}/i.test(key))
    return "PAYMONGO_SECRET_KEY looks like a masked or placeholder value. In the dashboard click Copy next to the TEST Secret key";
  if (/\s/.test(key)) return "PAYMONGO_SECRET_KEY contains spaces or line breaks";
  if (key.length < 20) return "PAYMONGO_SECRET_KEY looks too short — copy it again with the Copy button";
  return null;
};

const authHeader = () => {
  const problem = secretKeyProblem();
  if (problem) throw new Error(problem);
  return `Basic ${Buffer.from(`${getSecretKey()}:`).toString("base64")}`;
};

const request = async (method, path, body) => {
  const res = await fetch(`${PAYMONGO_API}${path}`, {
    method,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = json?.errors?.map((e) => e.detail).join("; ") || res.statusText;
    const err = new Error(`PayMongo ${res.status}: ${detail}`);
    err.status = res.status;
    err.paymongo = json;
    throw err;
  }
  return json.data;
};

// PHP → centavos (PayMongo requires integer amounts)
const toCentavos = (php) => Math.round(Number(php) * 100);

// PayMongo limits (docs: e-wallet errors). Minimum ₱20.00; GCash maximum ₱100,000.00.
const GCASH_MIN_CENTAVOS = 2000;
const GCASH_MAX_CENTAVOS = 10000000;

// true for sk_live_..., false for sk_test_... — used to reject events from the other mode
const isLiveKey = () => getSecretKey().startsWith("sk_live_");

/**
 * Create a hosted Checkout Session restricted to GCash.
 * Docs: https://developers.paymongo.com/reference/create-a-checkout
 */
const createGcashCheckoutSession = ({
  lineItems, // [{ name, quantity, unitPrice (PHP) }]
  referenceNumber, // our Checkout _id
  successUrl,
  cancelUrl,
  billing, // { name, email, phone }
  metadata = {},
}) =>
  request("POST", "/checkout_sessions", {
    data: {
      attributes: {
        line_items: lineItems.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          amount: toCentavos(item.unitPrice),
          currency: "PHP",
        })),
        payment_method_types: ["gcash"],
        reference_number: String(referenceNumber),
        description: `GrayScale order ${referenceNumber}`,
        success_url: successUrl,
        cancel_url: cancelUrl,
        send_email_receipt: false,
        show_description: true,
        show_line_items: true,
        billing,
        metadata,
      },
    },
  });

const retrieveCheckoutSession = (sessionId) =>
  request("GET", `/checkout_sessions/${sessionId}`);

// Returns the paid payment object from a session, or null
const getPaidPayment = (session) => {
  const attrs = session?.attributes || {};
  const paid = (attrs.payments || []).find((p) => p?.attributes?.status === "paid");
  if (paid) return paid;
  if (attrs.payment_intent?.attributes?.status === "succeeded") {
    return attrs.payment_intent;
  }
  return null;
};

/* -------------------------------------------------------------------------
 * DIRECT GCASH (Payment Intent workflow) — sends the customer straight to GCash,
 * skipping PayMongo's hosted "choose a payment method" page.
 * Docs: developers.paymongo.com/docs/payment-acceptance-e-wallets
 *   1. create Payment Intent (payment_method_allowed: ["gcash"])
 *   2. create Payment Method (type: "gcash")
 *   3. attach with return_url  ->  next_action.redirect.url
 *   4. customer authorizes in GCash, returns to return_url
 *   5. confirm by retrieving the intent (and via payment.paid webhook)
 * ------------------------------------------------------------------------- */

const createGcashPaymentIntent = ({ amountCentavos, description, metadata = {} }) =>
  request("POST", "/payment_intents", {
    data: {
      attributes: {
        amount: amountCentavos,
        currency: "PHP",
        payment_method_allowed: ["gcash"],
        description,
        metadata,
      },
    },
  });

const createGcashPaymentMethod = (billing) =>
  request("POST", "/payment_methods", {
    data: { attributes: { type: "gcash", ...(billing ? { billing } : {}) } },
  });

// Returns the updated intent; for GCash its status is "awaiting_next_action" with the redirect URL
const attachPaymentIntent = ({ intentId, paymentMethodId, clientKey, returnUrl }) =>
  request("POST", `/payment_intents/${encodeURIComponent(intentId)}/attach`, {
    data: {
      attributes: {
        payment_method: paymentMethodId,
        ...(clientKey ? { client_key: clientKey } : {}),
        return_url: returnUrl,
      },
    },
  });

const retrievePaymentIntent = (intentId) =>
  request("GET", `/payment_intents/${encodeURIComponent(intentId)}`);

const getRedirectUrl = (intent) => intent?.attributes?.next_action?.redirect?.url || null;

// The paid payment of a Payment Intent, or null
const getPaidPaymentFromIntent = (intent) => {
  const attrs = intent?.attributes || {};
  const paid = (attrs.payments || []).find((p) => p?.attributes?.status === "paid");
  if (paid) return paid;
  if (attrs.status === "succeeded") return { id: null, attributes: { status: "paid", amount: attrs.amount } };
  return null;
};

/**
 * Normalize a webhook body into { type, livemode, resource }.
 * PayMongo's docs show TWO envelopes, so accept both:
 *   classic: { data: { type: "event", attributes: { type, livemode, data: <resource> } } }
 *   newer:   { event_type: "send.webhook", data: { type, livemode, data: <resource> } }
 */
const parseWebhookEvent = (body) => {
  const d = body?.data;
  if (!d || typeof d !== "object") return null;

  if (d.attributes && typeof d.attributes.type === "string") {
    return { type: d.attributes.type, livemode: d.attributes.livemode === true, resource: d.attributes.data };
  }
  if (typeof d.type === "string" && d.type !== "event") {
    return { type: d.type, livemode: d.livemode === true, resource: d.data };
  }
  return null;
};

// Webhook endpoint management (used by scripts/setupPaymongoWebhook.js, never at runtime)
const listWebhooks = () => request("GET", "/webhooks");
const createWebhook = (url, events) =>
  request("POST", "/webhooks", { data: { attributes: { url, events } } });

/**
 * Verify the `Paymongo-Signature` header.
 * Format: t=<timestamp>,te=<test sig>,li=<live sig>
 * Signature = HMAC-SHA256(`${t}.${rawBody}`, webhookSecret)
 */
const verifyWebhookSignature = (rawBody, signatureHeader, livemode) => {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((kv) => {
      const [k, ...v] = kv.trim().split("=");
      return [k, v.join("=")];
    })
  );

  const expected = livemode ? parts.li : parts.te;
  if (!parts.t || !expected) return false;

  const computed = crypto
    .createHmac("sha256", secret)
    .update(`${parts.t}.${rawBody}`)
    .digest("hex");

  const a = Buffer.from(computed, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = {
  createGcashPaymentIntent,
  createGcashPaymentMethod,
  attachPaymentIntent,
  retrievePaymentIntent,
  getRedirectUrl,
  getPaidPaymentFromIntent,
  createGcashCheckoutSession,
  retrieveCheckoutSession,
  getPaidPayment,
  verifyWebhookSignature,
  parseWebhookEvent,
  listWebhooks,
  createWebhook,
  isLiveKey,
  secretKeyProblem,
  toCentavos,
  GCASH_MIN_CENTAVOS,
  GCASH_MAX_CENTAVOS,
};
