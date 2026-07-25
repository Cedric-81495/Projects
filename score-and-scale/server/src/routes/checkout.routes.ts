import { Router, Request, Response } from "express";
import { gateway } from "../lib/braintree";
import { requireAuth } from "../middleware/requireAuth";
import { Enrollment } from "../models/Enrollment";
import { Program } from "../models/Program";

const router = Router();

/**
 * GET /api/checkout/client-token
 * Frontend calls this first to initialize Drop-in / Hosted Fields.
 * A fresh token should be requested per checkout attempt.
 */
router.get("/client-token", requireAuth, async (_req: Request, res: Response) => {
  try {
    const { clientToken } = await gateway.clientToken.generate({});
    res.json({ clientToken });
  } catch (err) {
    console.error("Failed to generate Braintree client token", err);
    res.status(500).json({ error: "Unable to initialize payment form" });
  }
});

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
 * On success, upserts an Enrollment for (userId, programId) — this is what
 * makes a purchased program show up as "Enrolled" on the dashboard.
 */
router.post("/", requireAuth, async (req: Request, res: Response) => {
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
