import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PaymentForm from "../components/marketing/PaymentForm";

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const programSlug = searchParams.get("programSlug") ?? "";
  const amount = searchParams.get("amount") ?? "0.00";

  const [done, setDone] = useState(false);

  if (!programSlug) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <p className="text-red-600">Missing program selection. Please choose a program again.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">Payment received</h1>
        <p className="text-gray-600 mb-6">Thanks — your enrollment is confirmed.</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="rounded-lg bg-black text-white px-4 py-2"
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-16">
      <h1 className="text-2xl font-semibold mb-6">Complete your payment</h1>
      <PaymentForm
        amount={amount}
        programSlug={programSlug}
        onSuccess={() => setDone(true)}
      />
    </div>
  );
}
