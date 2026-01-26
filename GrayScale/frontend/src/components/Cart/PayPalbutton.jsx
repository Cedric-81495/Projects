import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useEffect, useState } from "react";

// Safe static fallback (₱56 ≈ $1)
const FALLBACK_RATE = 1 / 56;

const PayPalbutton = ({ amount, onSuccess, onError }) => {
  const [usdAmount, setUsdAmount] = useState(null);

  useEffect(() => {
   const convertPHPtoUSD = async () => {
      try {
        const res = await fetch("https://api.exchangerate.host/latest?base=PHP&symbols=USD");
        const data = await res.json();
        setUsdAmount((amount * data.rates.USD).toFixed(2));
      } catch (error) {
        console.warn("Primary API failed, using static fallback", error);
        setUsdAmount((amount * FALLBACK_RATE).toFixed(2));
      }
    };
        convertPHPtoUSD();
  }, [amount]);

  if (!usdAmount) return <p>Loading payment…</p>;

  return (
    <PayPalScriptProvider
      options={{
        "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
        currency: "USD",
      }}
    >
      <PayPalButtons
        style={{ layout: "vertical" }}
        createOrder={(data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  currency_code: "USD",
                  value: usdAmount,
                },
              },
            ],
          });
        }}
        onApprove={(data, actions) => {
          return actions.order.capture().then(onSuccess);
        }}
        onError={onError}
      />
    </PayPalScriptProvider>
  );
};

export default PayPalbutton;
