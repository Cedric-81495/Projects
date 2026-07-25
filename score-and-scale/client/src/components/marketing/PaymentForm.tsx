import { useEffect, useRef, useState } from "react";
import DropIn from "braintree-web-drop-in-react";
import type { Dropin } from "braintree-web-drop-in";
import { apiFetch } from "../../lib/api";
import { Spinner } from "../ui/Spinner";

interface ClientTokenResponse {
  clientToken: string;
}

interface CheckoutResponse {
  transactionId: string;
  status: string;
  enrollmentId: string;
}

interface PaymentFormProps {
  amount: string; // decimal string, e.g. "49.00"
  programSlug: string;
  onSuccess: (transactionId: string) => void;
  onError?: (message: string) => void;
}

export default function PaymentForm({
  amount,
  programSlug,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const [clientToken, setClientToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropinInstance = useRef<Dropin | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<ClientTokenResponse>("/api/checkout/client-token")
      .then((data) => {
        if (!cancelled) setClientToken(data.clientToken);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load payment form. Please refresh and try again.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handlePay() {
    if (!dropinInstance.current) return;
    setSubmitting(true);
    setError(null);

    try {
      const { nonce } = await dropinInstance.current.requestPaymentMethod();

      const data = await apiFetch<CheckoutResponse>("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          paymentMethodNonce: nonce,
          programSlug,
        }),
      });

      onSuccess(data.transactionId);
    } catch (err: any) {
      const message = err?.message || "Payment failed. Please check your details and try again.";
      setError(message);
      onError?.(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !clientToken) {
    return <p className="text-red-600 text-sm">{error}</p>;
  }

  if (!clientToken) {
    return <p className="text-sm text-gray-500">Loading payment form…</p>;
  }

  return (
    <div className="space-y-4">
      <DropIn
        options={{ authorization: clientToken }}
        onInstance={(instance) => {
          dropinInstance.current = instance;
        }}
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        onClick={handlePay}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-black text-white py-2.5 font-medium disabled:opacity-50"
      >
        {submitting && <Spinner size={16} />}
        {submitting ? "Processing…" : `Pay $${amount}`}
      </button>
    </div>
  );
}
