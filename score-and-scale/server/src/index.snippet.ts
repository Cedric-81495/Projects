// --- server/src/index.ts changes (snippet, not a full file) ---
//
// Stripe's webhook route needed raw body BEFORE express.json():
//   app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRoutes);
//
// Braintree webhooks are form-encoded, not signed raw JSON, so this
// special-case middleware ordering goes away. Normal parsers are enough:

import express from "express";
import checkoutRoutes from "./routes/checkout.routes";
import webhookRoutes from "./routes/webhooks.routes"; // optional, see file comments

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // needed for Braintree webhook form fields

app.use("/api/checkout", checkoutRoutes);
app.use("/api/webhooks", webhookRoutes); // optional

export default app;
