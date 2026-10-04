// backend/services/orderService.js
// Shared, idempotent "mark paid" + "finalize to Order" logic.
// Safe to call from both the verify endpoint and the webhook (whichever lands first wins).
const Checkout = require("../models/Checkout");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

/**
 * Take each item out of stock atomically. The `countInStock >= qty` condition and the
 * decrement happen in ONE database operation, so two orders can never both take the
 * last unit. Items that can't be fulfilled are returned as a shortfall (the customer
 * has already paid, so the order is still created and flagged for the admin).
 */
const decrementStock = async (items, taken) => {
  const shortfall = [];
  for (const item of items) {
    const result = await Product.updateOne(
      { _id: item.productId, countInStock: { $gte: item.quantity } },
      { $inc: { countInStock: -item.quantity } }
    );
    if (result.modifiedCount === 1) {
      taken.push(item); // recorded immediately so a later failure can put it back
    } else {
      shortfall.push({
        productId: item.productId,
        name: item.name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      });
    }
  }
  return shortfall;
};

// Put stock back (used if creating the order fails after stock was taken)
const restoreStock = async (items) => {
  for (const item of items) {
    await Product.updateOne({ _id: item.productId }, { $inc: { countInStock: item.quantity } });
  }
};

/**
 * Atomically mark a checkout as paid. No-op if already paid.
 */
const markCheckoutPaid = async (checkoutId, paymentDetails) => {
  await Checkout.findOneAndUpdate(
    { _id: checkoutId, isPaid: false },
    {
      $set: {
        isPaid: true,
        paidAt: new Date(),
        paymentStatus: "paid",
        paymentDetails,
      },
    }
  );
  return Checkout.findById(checkoutId);
};

/**
 * Convert a paid checkout into an Order exactly once.
 * Returns the Order (existing or newly created).
 */
const finalizeCheckout = async (checkoutId) => {
  // Atomically claim finalization so concurrent callers can't create duplicate orders
  const checkout = await Checkout.findOneAndUpdate(
    { _id: checkoutId, isPaid: true, isFinalized: false },
    { $set: { isFinalized: true, finalizedAt: new Date() } },
    { returnDocument: "after" }
  );

  if (!checkout) {
    // Either not paid yet, or someone else already finalized it
    return Order.findOne({ checkout: checkoutId });
  }

  const taken = [];
  try {
    const shortfall = await decrementStock(checkout.checkoutItems, taken);

    if (shortfall.length) {
      console.error("STOCK SHORTFALL on paid checkout", String(checkout._id), shortfall);
    }

    const order = await Order.create({
      stockShortfall: shortfall,
      checkout: checkout._id,
      user: checkout.user,
      orderItems: checkout.checkoutItems,
      shippingAddress: checkout.shippingAddress,
      paymentMethod: checkout.paymentMethod,
      totalPrice: checkout.totalPrice,
      isPaid: true,
      paidAt: checkout.paidAt,
      isDelivered: false,
      paymentStatus: "paid",
      paymentDetails: checkout.paymentDetails,
    });

    // Clear the user's cart
    await Cart.findOneAndUpdate(
      { user: checkout.user },
      { $set: { products: [], totalPrice: 0 } }
    );

    return order;
  } catch (error) {
    // Roll back stock and the claim so a retry can finalize cleanly
    await restoreStock(taken).catch((e) => console.error("Stock restore failed", e));
    await Checkout.updateOne(
      { _id: checkoutId },
      { $set: { isFinalized: false }, $unset: { finalizedAt: 1 } }
    );
    throw error;
  }
};

module.exports = { markCheckoutPaid, finalizeCheckout };
