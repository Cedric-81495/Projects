import { Router, Request, Response } from "express";
import { gateway } from "../lib/braintree";

const router = Router();

/**
 * POST /api/webhooks/braintree
 * Optional: only needed if you want notifications for disputes,
 * subscription charges, refunds, etc. A simple one-time Drop-in
 * sale (see checkout.routes.ts) is confirmed synchronously and
 * does NOT require this route to function.
 *
 * Unlike Stripe, Braintree does not require raw-body parsing for
 * signature verification — normal express.json() body parsing is fine.
 *
 * Braintree sends bt_signature and bt_payload as form-encoded fields,
 * so make sure express.urlencoded() is applied to this route (or globally).
 */
router.post("/braintree", async (req: Request, res: Response) => {
  const { bt_signature, bt_payload } = req.body;

  if (!bt_signature || !bt_payload) {
    return res.status(400).send("Missing webhook payload");
  }

  try {
    const notification = await gateway.webhookNotification.parse(bt_signature, bt_payload);

    switch (notification.kind) {
      case "dispute_opened":
        console.log("Dispute opened:", notification.dispute?.transaction?.id);
        // TODO: flag the related enrollment/order for review
        break;
      case "subscription_charged_successfully":
        console.log("Subscription charged:", notification.subscription?.id);
        break;
      case "subscription_charged_unsuccessfully":
        console.log("Subscription charge failed:", notification.subscription?.id);
        break;
      default:
        console.log("Unhandled Braintree webhook kind:", notification.kind);
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("Invalid Braintree webhook signature", err);
    res.status(400).send("Invalid signature");
  }
});

export default router;
