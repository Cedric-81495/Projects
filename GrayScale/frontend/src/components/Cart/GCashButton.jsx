// GCashButton.jsx
// Starts a PayMongo GCash checkout for an existing Checkout and redirects the user.
// Payment is confirmed on /payment/gcash/return (and by the backend webhook), NOT here.
import { useState } from "react";
import { toast } from "sonner";
import axiosInstance from "../../utils/axiosInstance";
import { withRetry } from "../../utils/retry";

const GCashButton = ({ checkoutId, amount, billing, onError, onAlreadyPaid }) => {
  const [redirecting, setRedirecting] = useState(false);

  const handleClick = async (e) => {
    e.preventDefault();

    if (!checkoutId) {
      toast.error("Please continue to payment first.");
      return;
    }

    setRedirecting(true);
    try {
      const { data } = await withRetry(
        () => axiosInstance.post("/api/payments/gcash/create-session", { checkoutId, billing }),
        { retries: 2 }
      );

      // Already paid in an earlier tab/attempt -> the server finished that order instead
      if (data?.status === "paid" && data.order) {
        toast.success("You already paid for this order — it's confirmed!");
        onAlreadyPaid?.(data.order);
        return;
      }

      if (!data?.checkoutUrl) throw new Error("No checkout URL returned");

      toast.info("Redirecting to GCash…");
      window.location.assign(data.checkoutUrl);
    } catch (err) {
      setRedirecting(false);
      const message = err.response?.data?.message || "Unable to start GCash payment";
      const detail = err.response?.data?.detail; // only sent by the backend in development
      if (detail) console.error("GCash setup error:", detail);
      toast.error(message, detail ? { description: detail, duration: 10000 } : undefined);
      onError?.(err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={redirecting}
      className={`w-full bg-blue-600 text-white py-3 mb-2 rounded transition ${
        redirecting ? "opacity-60 cursor-not-allowed" : "hover:bg-blue-700"
      }`}
    >
      {redirecting
        ? "Redirecting to GCash…"
        : `Pay ₱${Number(amount || 0).toLocaleString()} with GCash`}
    </button>
  );
};

export default GCashButton;
