import { Router, Request, Response } from "express";
import { gateway } from "../lib/braintree";
import { requireAuth } from "../middleware/requireAuth";
import { clientTokenLimiter, checkoutLimiter } from "../middleware/rateLimit";
import { Enrollment } from "../models/Enrollment";
import { Payment } from "../models/Payment";
import { Program } from "../models/Program";
import { User } from "../models/User";
import { sendMail } from "../lib/mailer";

const router = Router();

/**
 * GET /api/checkout/client-token
 * Frontend calls this first to initialize Drop-in / Hosted Fields.
 * A fresh token should be requested per checkout attempt.
 */
router.get("/client-token", requireAuth, clientTokenLimiter, async (_req: Request, res: Response) => {
  try {
    const { clientToken } = await gateway.clientToken.generate({});
    res.json({ clientToken });
  } catch (err) {
    console.error("Failed to generate Braintree client token", err);
    res.status(500).json({ error: "Unable to initialize payment form" });
  }
});

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

/**
 * POST /api/checkout
 * Body: { paymentMethodNonce: string, programSlug: string }
 *
 * NOTE: the charge amount is intentionally NOT taken from the request body.
 * It's derived from Program.priceCents server-side — trusting a client-sent
 * amount would let someone tamper with the request and pay less than the
 * real price. The frontend still displays the price for UX, but this route
 * ignores whatever it sends and looks up the real price itself.
 *
 * On success:
 *  - upserts an Enrollment for (userId, programId) — this is what makes a
 *    purchased program show up as "Enrolled" on the dashboard.
 *  - creates a Payment record tied to that Enrollment — this is what
 *    powers the admin revenue KPI.
 *  - emails a receipt to the paying user and a notification copy to the
 *    business (CONTACT_NOTIFY_EMAIL, same address used for contact form
 *    submissions) — neither is allowed to fail the user-facing request.
 */
router.post("/", requireAuth, checkoutLimiter, async (req: Request, res: Response) => {
  const { paymentMethodNonce, programSlug } = req.body;

  if (!paymentMethodNonce || !programSlug) {
    return res.status(400).json({ error: "paymentMethodNonce and programSlug are required" });
  }

  const program = await Program.findOne({ slug: programSlug });
  if (!program) {
    return res.status(404).json({ error: "Program not found" });
  }

  // priceCents (e.g. 49700) -> Braintree's expected decimal string ("497.00")
  const amount = (program.priceCents / 100).toFixed(2);

  try {
    const result = await gateway.transaction.sale({
      amount,
      paymentMethodNonce,
      options: {
        submitForSettlement: true,
      },
    });

    if (!result.success) {
      return res.status(400).json({
        error: result.message || "Payment failed",
        processorResponse: result.transaction?.processorResponseText,
      });
    }

    const userId = req.user!.userId;

    // Upsert: if this user already has an Enrollment for this program
    // (e.g. a prior pending/cancelled attempt), update it in place rather
    // than creating a duplicate. Otherwise create a new one.
    let enrollment = await Enrollment.findOne({ userId, programId: program._id });

    if (!enrollment) {
      enrollment = new Enrollment({
        userId,
        programId: program._id,
        status: "active",
        braintreeTransactionId: result.transaction.id,
        history: [{ status: "active", changedAt: new Date() }],
      });
    } else {
      enrollment.status = "active";
      enrollment.braintreeTransactionId = result.transaction.id;
      enrollment.history.push({ status: "active", changedAt: new Date() });
    }

    await enrollment.save();

    // Record the payment itself. Guarded with its own try/catch so that if
    // this ever fails (e.g. a duplicate braintreeTransactionId on a retried
    // request), the user still gets their success response and active
    // enrollment rather than a 500 — the charge and enrollment are the
    // source of truth; this is a reporting record.
    try {
      await Payment.create({
        enrollmentId: enrollment._id,
        braintreeTransactionId: result.transaction.id,
        amountCents: program.priceCents,
        status: "succeeded",
      });
    } catch (paymentErr) {
      console.error(
        `Failed to record Payment for transaction ${result.transaction.id} (enrollment ${enrollment._id}) — charge succeeded, revenue reporting may be incomplete`,
        paymentErr
      );
    }

    // Receipt emails — best-effort, never block the response on these.
    // A failed email should not make a successful charge look like a
    // failure to the person who just paid.
    try {
      const user = await User.findById(userId).select("email name");
      const priceFormatted = formatCents(program.priceCents);
      const receiptHtml = `
        <p>Hi ${user?.name ?? "there"},</p>
        <p>Thanks for your payment — here's your receipt.</p>
        <table cellpadding="6" style="border-collapse: collapse;">
          <tr><td><strong>Program</strong></td><td>${program.name}</td></tr>
          <tr><td><strong>Amount</strong></td><td>${priceFormatted}</td></tr>
          <tr><td><strong>Transaction ID</strong></td><td>${result.transaction.id}</td></tr>
          <tr><td><strong>Date</strong></td><td>${new Date().toLocaleDateString()}</td></tr>
        </table>
        <p>You can view your enrollment status any time from your dashboard.</p>
      `;

      if (user?.email) {
        await sendMail({
          to: user.email,
          subject: `Receipt for your ${program.name} payment`,
          html: receiptHtml,
        }).catch((err) => console.error("Failed to send receipt email to user:", err));
      }

      if (process.env.CONTACT_NOTIFY_EMAIL) {
        await sendMail({
          to: process.env.CONTACT_NOTIFY_EMAIL,
          subject: `New payment received — ${program.name} (${priceFormatted})`,
          html: `
            <p>New payment received.</p>
            <table cellpadding="6" style="border-collapse: collapse;">
              <tr><td><strong>User</strong></td><td>${user?.email ?? "unknown"}</td></tr>
              <tr><td><strong>Program</strong></td><td>${program.name}</td></tr>
              <tr><td><strong>Amount</strong></td><td>${priceFormatted}</td></tr>
              <tr><td><strong>Transaction ID</strong></td><td>${result.transaction.id}</td></tr>
            </table>
          `,
        }).catch((err) => console.error("Failed to send payment notification email to business:", err));
      }
    } catch (emailErr) {
      console.error("Failed to send receipt/notification emails (charge succeeded, this is non-blocking):", emailErr);
    }

    res.json({
      transactionId: result.transaction.id,
      status: result.transaction.status,
      enrollmentId: enrollment._id,
    });
  } catch (err) {
    console.error("Braintree transaction error (charge may have succeeded — check Braintree dashboard)", err);
    res.status(500).json({ error: "Payment processing failed" });
  }
});

export default router;