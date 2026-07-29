import braintree from "braintree";

// Required env vars (server/.env):
//   BT_ENV=sandbox | production
//   BT_MERCHANT_ID=...
//   BT_PUBLIC_KEY=...
//   BT_PRIVATE_KEY=...
const required = ["BT_MERCHANT_ID", "BT_PUBLIC_KEY", "BT_PRIVATE_KEY"] as const;
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}

export const gateway = new braintree.BraintreeGateway({
  environment:
    process.env.BT_ENV === "production"
      ? braintree.Environment.Production
      : braintree.Environment.Sandbox,
  merchantId: process.env.BT_MERCHANT_ID!,
  publicKey: process.env.BT_PUBLIC_KEY!,
  privateKey: process.env.BT_PRIVATE_KEY!,
});

export default gateway;
