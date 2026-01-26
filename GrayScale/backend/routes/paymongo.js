// routes/paymongo.js
const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();
const router = express.Router();

router.post("/create-intent", async (req, res) => {
  try {
    const { amount, email, name, phone } = req.body;

    const headers = {
      Authorization: `Basic ${Buffer
        .from(process.env.PAYMONGO_SECRET_KEY + ":")
        .toString("base64")}`
      };

    const intentRes = await axios.post(
      "https://api.paymongo.com/v1/payment_intents",
      {
        data: {
          attributes: {
            amount: amount * 100,
            payment_method_allowed: ["gcash"],
            currency: "PHP",
          },
        },
      },
      { headers }
    );

    const intentId = intentRes.data.data.id;

    const methodRes = await axios.post(
      "https://api.paymongo.com/v1/payment_methods",
      {
        data: {
          attributes: {
            type: "gcash",
            billing: { name, email, phone },
          },
        },
      },
      { headers }
    );

    const methodId = methodRes.data.data.id;

    const attachRes = await axios.post(
      `https://api.paymongo.com/v1/payment_intents/${intentId}/attach`,
      {
        data: {
          attributes: {
            payment_method: methodId,
          },
        },
      },
      { headers }
    );

    const redirectUrl = attachRes.data.data.attributes.next_action.redirect.url;
    res.json({ checkoutUrl: redirectUrl });
  } catch (err) {
    console.error("PayMongo error:", err.response?.data || err.message);
    res.status(400).json({ error: err.response?.data || err.message });
  }
});

module.exports = router;
