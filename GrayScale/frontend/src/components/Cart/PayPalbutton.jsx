// PayPalbutton.jsx
// The browser never decides the amount or marks anything paid:
//  - createOrder asks OUR backend to create the PayPal order (server-priced, in PHP)
//  - onApprove asks OUR backend to capture + verify it, which returns the created Order
// Slow/dropped connections: capture is retried automatically. The backend makes retries safe
// (it checks with PayPal first and never captures twice), so a lost response can't double-charge.
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import axiosInstance from "../../utils/axiosInstance";
import { withRetry } from "../../utils/retry";

const NOT_CONFIRMED_YET =
  "We couldn't confirm your payment because of a connection problem. Please DON'T pay again — " +
  "if you were charged, your order will appear in My Orders automatically within a few minutes.";

const PayPalbutton = ({ checkoutId, onSuccess, onError, onRetrying }) => {
  if (!checkoutId) return null;

  return (
    <PayPalScriptProvider
      options={{
        clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
        currency: "PHP",
        intent: "capture",
      }}
    >
      <PayPalButtons
        style={{ layout: "vertical" }}
        forceReRender={[checkoutId]}
        createOrder={async () => {
          try {
            const { data } = await withRetry(
              () => axiosInstance.post("/api/payments/paypal/create-order", { checkoutId }),
              { retries: 2 }
            );
            return data.id;
          } catch (err) {
            // Already paid (e.g. an earlier attempt went through) -> go straight to the order
            const order = err.response?.data?.order;
            if (order) onSuccess?.(order);
            throw err;
          }
        }}
        onApprove={async (data) => {
          try {
            const res = await withRetry(
              () =>
                axiosInstance.post(
                  "/api/payments/paypal/capture",
                  { checkoutId, orderID: data.orderID },
                  { timeout: 45000 }
                ),
              { retries: 4, baseDelay: 1500, onRetry: (n) => onRetrying?.(n) }
            );
            onSuccess?.(res.data.order);
          } catch (err) {
            if (!err.response || err.response.status >= 500) {
              // Still no answer after retries: money MAY have moved. Never tell them it failed.
              err.userMessage = NOT_CONFIRMED_YET;
            }
            onError?.(err);
          }
        }}
        onError={(err) => onError?.(err)}
      />
    </PayPalScriptProvider>
  );
};

export default PayPalbutton;
