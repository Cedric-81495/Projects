// GCashButton.jsx
import { toast } from "sonner";

const GCashButton = ({ amount, onSuccess, onError, }) => {
  const handleClick = (e) => {
    e.preventDefault();

    if (!amount || amount <= 0) {
      toast.error("Invalid payment amount");
      return;
    }

    // Replace this link with your actual PayMongo payment link
    // For testing, make sure the amount matches what you set in PayMongo
    const paymentLink = "https://pm.link/org-87SVy2pGTax85CPo5Sb5jFEn/viyaiCK";

    toast.info(`Redirecting to GCash for PHP ${amount}`);
    try {
      window.location.href = paymentLink;
      onSuccess?.({ amount });
    } catch (err) {
      onError?.(err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full bg-green-600 text-white py-3 mb-2 rounded hover:bg-green-700 transition"
    >
      Pay PHP {amount} with GCash
    </button>
  );
};

export default GCashButton;
