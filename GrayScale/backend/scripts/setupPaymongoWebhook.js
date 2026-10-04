// backend/scripts/setupPaymongoWebhook.js
// Registers the GrayScale webhook with PayMongo ONCE and prints its signing secret.
//
//   npm run paymongo:webhook -- https://your-backend.onrender.com
//
// Uses PAYMONGO_SECRET_KEY from backend/.env. Test keys (sk_test_) create a test-mode
// webhook; live keys (sk_live_) create a live one — PayMongo keeps them separate, so run
// this once per mode and use the matching secret in each environment's .env.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { listWebhooks, createWebhook, isLiveKey, secretKeyProblem } = require("../utils/paymongo");

const WEBHOOK_PATH = "/api/payments/paymongo/webhook";
// payment.paid / payment.failed: direct GCash flow (Payment Intents)
// checkout_session.payment.paid: sessions created before the switch to the direct flow
const EVENTS = ["payment.paid", "payment.failed", "checkout_session.payment.paid"];

// Throw instead of process.exit(): exiting right after a network request crashes Node on
// Windows ("Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)").
class SetupError extends Error {}
const fail = (message) => {
  throw new SetupError(message);
};

(async () => {
  const keyProblem = secretKeyProblem();
  if (keyProblem) fail(keyProblem);

  const input = process.argv[2];
  if (!input) {
    fail(`Usage: npm run paymongo:webhook -- https://your-backend-domain\n  (the path ${WEBHOOK_PATH} is added for you)`);
  }

  let url;
  try {
    url = new URL(input);
  } catch {
    fail(`Not a valid URL: ${input}`);
  }
  if (!url.pathname || url.pathname === "/") url.pathname = WEBHOOK_PATH;

  const live = isLiveKey();
  if (url.protocol !== "https:") {
    fail("PayMongo webhooks need a public HTTPS URL (use your Render URL, or an ngrok https URL for local testing).");
  }
  if (["localhost", "127.0.0.1"].includes(url.hostname)) {
    fail("PayMongo can't reach localhost. Use your deployed URL or an ngrok https URL.");
  }
  if (url.pathname !== WEBHOOK_PATH) {
    console.warn(`⚠️  Path is ${url.pathname}, but the server listens on ${WEBHOOK_PATH}`);
  }

  const target = url.toString();
  console.log(`\nMode:   ${live ? "LIVE" : "test"}`);
  console.log(`URL:    ${target}`);
  console.log(`Events: ${EVENTS.join(", ")}\n`);

  try {
    const existing = (await listWebhooks()) || [];
    const match = existing.find((w) => w?.attributes?.url === target);
    if (match) {
      const have = match.attributes.events || [];
      const missing = EVENTS.filter((e) => !have.includes(e));
      if (missing.length) {
        console.log(`⚠️  A webhook for this URL exists (${match.id}) but is missing: ${missing.join(", ")}`);
        console.log("  Disable it in the PayMongo dashboard (Developers → Webhooks), then run this again");
        console.log("  to create one with all events. Put the NEW secret in PAYMONGO_WEBHOOK_SECRET.\n");
        return;
      }
      console.log(`✔ Already registered (${match.id}, status: ${match.attributes.status}).`);
      console.log("  Its secret is shown only once, when created. If you've lost it, disable this");
      console.log("  webhook in the PayMongo dashboard (Developers → Webhooks) and run this again.\n");
      return;
    }

    const webhook = await createWebhook(target, EVENTS);
    const secret = webhook?.attributes?.secret_key;

    console.log(`✔ Webhook created: ${webhook.id}`);
    if (secret) {
      console.log("\nAdd this to backend/.env (and your hosting provider's environment settings):\n");
      console.log(`  PAYMONGO_WEBHOOK_SECRET=${secret}\n`);
    } else {
      console.log("\n⚠️  No secret_key in the response. Copy the signing secret from the PayMongo");
      console.log("   dashboard (Developers → Webhooks) into PAYMONGO_WEBHOOK_SECRET.\n");
    }
  } catch (error) {
    if (error instanceof SetupError) throw error;
    const hint =
      error.status === 401
        ? "\n  The key was rejected. In the dashboard (TEST section) click Copy next to the Secret key,\n  paste it into backend/.env as PAYMONGO_SECRET_KEY=..., save the file, and run this again."
        : "";
    fail(`PayMongo rejected the request: ${error.message}${hint}`);
  }
})().catch((error) => {
  console.error(`\n✖ ${error.message}\n`);
  process.exitCode = 1; // let Node close network handles cleanly, then exit with failure
});
