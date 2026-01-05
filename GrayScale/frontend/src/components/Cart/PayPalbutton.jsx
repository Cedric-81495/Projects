import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useEffect, useState } from "react";

// Safe static fallback (₱56 ≈ $1)
const FALLBACK_RATE = 1 / 56;

const PayPalbutton = ({ amount, onSuccess, onError }) => {
  const [usdAmount, setUsdAmount] = useState(null);

  useEffect(() => {
    const convertPHPtoUSD = async () => {
      try {
        // exchangerate.host
        const res = await fetch(
          `https://api.exchangerate.host/latest?access_key=${import.meta.env.VITE_EXCHANGE_API_KEY}&base=PHP&symbols=USD`
        );

        const data = await res.json();

       // if (!data.success || !data.rates?.USD) {
         // throw new Error("Primary exchange rate failed");
        //}

        setUsdAmount((amount * data.rates.USD).toFixed(2));
      } catch (error) {
        console.log("Primary API failed, trying fallback…", error);
         // open.er-api.com (no key)
        try {
          const res2 = await fetch("https://open.er-api.com/v6/latest/PHP");
          const data2 = await res2.json();

          if (data2.result !== "success" || !data2.rates?.USD) {
            throw new Error("Secondary exchange rate failed");
          }

          setUsdAmount((amount * data2.rates.USD).toFixed(2));
        } catch (error) {
          console.error("All APIs failed, using static fallback rate:", error);

          setUsdAmount((amount * FALLBACK_RATE).toFixed(2));
        }
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
