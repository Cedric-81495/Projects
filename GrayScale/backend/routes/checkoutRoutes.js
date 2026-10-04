const express = require("express");
const Checkout = require("../models/Checkout");
const { protect } = require("../middleware/authMiddleware");
const { validateObjectIdParam } = require("../middleware/validateObjectId");
const { priceItems, PricingError } = require("../services/pricingService");
const { finalizeCheckout } = require("../services/orderService");

const router = express.Router();
router.param("id", validateObjectIdParam); // invalid IDs -> 404, not 500

const PAYMENT_METHODS = ["GCash", "PayPal"];
// All required for new checkouts (schema keeps them optional so old orders stay valid)
const ADDRESS_FIELDS = ["firstName", "lastName", "phone", "address", "city", "postalCode", "country"];
const PHONE_PATTERN = /^\+?[0-9\s-]{7,20}$/;

// Returns { address } or { error }
const cleanAddress = (shippingAddress = {}) => {
  const clean = {};
  for (const field of ADDRESS_FIELDS) {
    const value = String(shippingAddress?.[field] ?? "").trim();
    if (!value) return { error: `Shipping ${field} is required` };
    clean[field] = value.slice(0, 200);
  }
  if (!PHONE_PATTERN.test(clean.phone)) {
    return { error: "Please enter a valid phone number" };
  }
  return { address: clean };
};

// @route POST /api/checkout
// @desc Create a new checkout session. Prices and total are computed on the server.
// @access Private
router.post("/", protect, async (req, res) => {
  // Only productId / size / color / quantity are read from checkoutItems.
  // Any price or totalPrice sent by the client is ignored.
  const { checkoutItems, shippingAddress, paymentMethod } = req.body;

  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ message: "Invalid payment method" });
  }

  const { address, error: addressError } = cleanAddress(shippingAddress);
  if (addressError) {
    return res.status(400).json({ message: addressError });
  }

  try {
    const { items, totalPrice } = await priceItems(checkoutItems);

    const newCheckout = await Checkout.create({
      user: req.user._id,
      checkoutItems: items,
      shippingAddress: address,
      paymentMethod,
      totalPrice,
      paymentStatus: "pending",
      isPaid: false,
    });

    res.status(201).json(newCheckout);
  } catch (error) {
    if (error instanceof PricingError) {
      return res.status(400).json({ message: error.message });
    }
    console.log("Error creating checkout session", error);
    res.status(500).json({ message: "Server error" });
  }
});

// NOTE: PUT /api/checkout/:id/pay was REMOVED.
// It let the client mark its own checkout as paid. Payments are now confirmed only by the
// server talking to the payment provider:
//   PayPal -> POST /api/payments/paypal/capture
//   GCash  -> GET  /api/payments/gcash/verify/:checkoutId  (+ PayMongo webhook)

// @route POST /api/checkout/:id/finalize
// @desc Convert a paid checkout into an order (idempotent). Normally done automatically by the
//       payment routes; kept for retrying if that step failed.
// @access Private (owner only)
router.post("/:id/finalize", protect, async (req, res) => {
  try {
    const checkout = await Checkout.findById(req.params.id);

    if (!checkout || String(checkout.user) !== String(req.user._id)) {
      return res.status(404).json({ message: "Checkout not found" });
    }

    if (!checkout.isPaid) {
      return res.status(400).json({ message: "Checkout is not paid" });
    }

    const order = await finalizeCheckout(checkout._id);
    if (!order) {
      return res.status(409).json({ message: "Checkout could not be finalized" });
    }

    res.status(200).json(order);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Checkout not found" });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
