// frontend/src/pages/GCashReturnPage.jsx
// PayMongo redirects here after the GCash page:
//   /payment/gcash/return?checkoutId=...&status=success|cancelled
// We never trust the "status" query param for payment — the backend verifies with PayMongo.
//
// Slow or unstable connections: each check retries on network errors/timeouts, and the page keeps
// checking for ~30s. If it still can't confirm, it NEVER says "failed" — it says "still processing",
// offers "Check again", and My Orders recovers the order automatically once the payment is found.
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import axiosInstance from "../utils/axiosInstance";
import { withRetry } from "../utils/retry";
import { clearCart } from "../../redux/slices/cartSlice";

const MAX_CHECKS = 10; // ~30s of checking
const CHECK_INTERVAL_MS = 3000;

const GCashReturnPage = () => {
  const [params] = useSearchParams();
  const checkoutId = params.get("checkoutId");
  const redirectStatus = params.get("status");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [state, setState] = useState(redirectStatus === "cancelled" ? "cancelled" : "verifying");
  const [slow, setSlow] = useState(false); // connection trouble -> reassure the customer

  const [attemptKey, setAttemptKey] = useState(0); // "Check again" bumps this to re-run

  useEffect(() => {
    if (!checkoutId || redirectStatus === "cancelled") return undefined;
    let active = true; // false once the page is left or a new run starts

    const runChecks = async () => {
      for (let check = 1; check <= MAX_CHECKS; check++) {
        if (!active) return;
        try {
          const { data } = await withRetry(
            () => axiosInstance.get(`/api/payments/gcash/verify/${checkoutId}`, { timeout: 15000 }),
            { retries: 2, baseDelay: 1500, onRetry: () => active && setSlow(true) }
          );
          if (!active) return;

          if (data.status === "paid" && data.order?._id) {
            dispatch(clearCart());
            navigate(`/order-confirmation/${data.order._id}`, { replace: true });
            return;
          }
          if (data.status === "expired" || data.status === "failed") {
            setState(data.status);
            return;
          }
          // "pending": PayMongo hasn't confirmed yet — keep checking
        } catch (err) {
          if (!active) return;
          const status = err.response?.status;
          if (status === 401 || status === 403 || status === 404) {
            setState("error"); // not a connection problem: wrong account / unknown checkout
            return;
          }
          setSlow(true); // connection still bad after retries — keep trying on the next check
        }
        await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL_MS));
      }
      if (active) setState("pending");
    };

    runChecks();
    return () => {
      active = false;
    };
  }, [checkoutId, redirectStatus, attemptKey, dispatch, navigate]);

  const checkAgain = () => {
    setState("verifying");
    setSlow(false);
    setAttemptKey((k) => k + 1);
  };

  const messages = {
    verifying: [
      "Confirming your GCash payment…",
      slow
        ? "Your connection seems slow — still checking. Please keep this page open."
        : "Please don't close this page.",
    ],
    cancelled: ["Payment cancelled", "You were not charged. You can try again from checkout."],
    expired: ["Payment session expired", "You were not charged. Please go back to checkout and try again."],
    failed: ["GCash payment didn't go through", "You were not charged. You can try again from checkout, or choose another payment method."],
    pending: [
      "Payment still processing",
      "We haven't received confirmation yet. Please don't pay again — if you were charged, your order will appear in My Orders automatically within a few minutes.",
    ],
    error: [
      "We couldn't check this payment",
      "Please make sure you're logged in to the account you paid with, then open My Orders.",
    ],
  };

  if (!checkoutId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Invalid payment link</h2>
        <Link to="/" className="text-blue-500 underline">Go home</Link>
      </div>
    );
  }

  const [title, body] = messages[state];

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      {state === "verifying" && (
        <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin mb-6" />
      )}
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-600 mb-6 max-w-md">{body}</p>
      {state !== "verifying" && (
        <div className="flex flex-wrap gap-4 justify-center">
          {state === "pending" && (
            <button type="button" onClick={checkAgain} className="bg-black text-white px-6 py-2 rounded">
              Check again
            </button>
          )}
          <Link to="/my-orders" className="border border-black px-6 py-2 rounded">My Orders</Link>
          {(state === "cancelled" || state === "expired" || state === "failed") && (
            <Link to="/checkout" className="bg-black text-white px-6 py-2 rounded">Back to Checkout</Link>
          )}
        </div>
      )}
    </div>
  );
};

export default GCashReturnPage;
