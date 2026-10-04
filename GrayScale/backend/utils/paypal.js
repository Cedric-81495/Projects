// backend/utils/paypal.js
// Server-side PayPal Orders v2 client (native fetch).
// Sandbox: https://api-m.sandbox.paypal.com   Live: https://api-m.paypal.com
const apiBase = () =>
  (process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com").replace(/\/$/, "");

let cachedToken = null; // { value, expiresAt }

const getAccessToken = async () => {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are not set");
  }

  const res = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) {
    throw new Error(`PayPal auth failed (${res.status})`);
  }

  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + (json.expires_in || 300) * 1000,
  };
  return cachedToken.value;
};

const request = async (method, path, body, extraHeaders = {}) => {
  const token = await getAccessToken();
  const res = await fetch(`${apiBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const issue = json?.details?.[0]?.issue || json?.name || res.statusText;
    const err = new Error(`PayPal ${res.status}: ${issue}`);
    err.status = res.status;
    err.issue = issue;
    err.paypal = json;
    throw err;
  }
  return json;
};

// PayPal wants a string with exactly 2 decimals for PHP
const formatAmount = (php) => (Math.round(Number(php) * 100) / 100).toFixed(2);

const createOrder = ({ checkoutId, amount, currency = "PHP" }) =>
  request(
    "POST",
    "/v2/checkout/orders",
    {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: String(checkoutId),
          custom_id: String(checkoutId),
          description: `GrayScale order ${checkoutId}`,
          amount: { currency_code: currency, value: formatAmount(amount) },
        },
      ],
    }
  );

const captureOrder = (paypalOrderId) =>
  request("POST", `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {}, {
    "PayPal-Request-Id": `capture-${paypalOrderId}`, // idempotent retries
  });

const getOrder = (paypalOrderId) =>
  request("GET", `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`);

/**
 * Pull the completed capture out of a PayPal order/capture response.
 * Returns null unless the order AND its capture are COMPLETED.
 */
const getCompletedCapture = (paypalOrder) => {
  if (paypalOrder?.status !== "COMPLETED") return null;
  const unit = paypalOrder.purchase_units?.[0];
  const capture = unit?.payments?.captures?.find((c) => c.status === "COMPLETED");
  if (!capture) return null;
  return { unit, capture };
};

module.exports = { createOrder, captureOrder, getOrder, getCompletedCapture, formatAmount };
