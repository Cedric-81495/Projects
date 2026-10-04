// backend/services/pricingService.js
// Single source of truth for what a customer pays.
// Every checkout / payment path uses this — client-sent prices and totals are ignored.
const mongoose = require("mongoose");
const Product = require("../models/Product");

const MAX_LINE_ITEMS = 50;
const MAX_QTY_PER_ITEM = 99;

class PricingError extends Error {
  constructor(message) {
    super(message);
    this.name = "PricingError";
    this.status = 400;
  }
}

// What a customer pays per unit: the sale price (discountPrice) when it's a valid
// discount, otherwise the regular price. The product page, cart and every payment
// path all use this, so the price shown is always the price charged.
const getUnitPrice = (product) => {
  const price = Number(product.price);
  const sale = Number(product.discountPrice);
  if (Number.isFinite(sale) && sale > 0 && sale < price) return sale;
  return price;
};

// Round to centavos to avoid floating point drift (e.g. 0.1 + 0.2)
const roundMoney = (n) => Math.round(Number(n) * 100) / 100;

/**
 * Takes untrusted items ({ productId, quantity, size, color, ...anything }) and returns
 * trusted items built from the Product collection, plus the total.
 * Throws PricingError (400) for anything invalid.
 */
const priceItems = async (rawItems, { checkStock = true } = {}) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new PricingError("No items in checkout");
  }
  if (rawItems.length > MAX_LINE_ITEMS) {
    throw new PricingError(`Too many items (max ${MAX_LINE_ITEMS})`);
  }

  // Validate shape first
  for (const item of rawItems) {
    const id = String(item?.productId || "");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new PricingError("Invalid product in checkout");
    }
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) {
      throw new PricingError("Invalid quantity in checkout");
    }
    if (!item.size || !item.color) {
      throw new PricingError("Size and color are required for every item");
    }
  }

  const ids = [...new Set(rawItems.map((i) => String(i.productId)))];
  const products = await Product.find({ _id: { $in: ids } });
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  // Total quantity per product (same product can appear in several size/color lines)
  const qtyByProduct = new Map();

  const items = rawItems.map((raw) => {
    const product = productMap.get(String(raw.productId));
    if (!product || !product.isPublished) {
      throw new PricingError(`${raw.name || "A product in your cart"} is no longer available`);
    }

    const size = String(raw.size);
    const color = String(raw.color);
    if (!product.sizes.includes(size)) {
      throw new PricingError(`Size ${size} is not available for ${product.name}`);
    }
    if (!product.colors.includes(color)) {
      throw new PricingError(`Color ${color} is not available for ${product.name}`);
    }

    const quantity = Number(raw.quantity);
    qtyByProduct.set(
      String(product._id),
      (qtyByProduct.get(String(product._id)) || 0) + quantity
    );

    return {
      productId: product._id,
      name: product.name,
      image: product.images?.[0]?.url || "",
      price: roundMoney(getUnitPrice(product)),
      size,
      color,
      quantity,
    };
  });

  if (checkStock) {
    for (const [id, qty] of qtyByProduct) {
      const product = productMap.get(id);
      if (product.countInStock < qty) {
        throw new PricingError(`Not enough stock for ${product.name}`);
      }
    }
  }

  const totalPrice = roundMoney(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  if (totalPrice <= 0) throw new PricingError("Invalid order total");

  return { items, totalPrice };
};

/**
 * Re-price an existing checkout document in place (prices may have changed since it was created).
 * Caller is responsible for saving.
 */
const repriceCheckout = async (checkout) => {
  const { items, totalPrice } = await priceItems(checkout.checkoutItems);
  checkout.checkoutItems = items;
  checkout.totalPrice = totalPrice;
  return checkout;
};

module.exports = { priceItems, repriceCheckout, getUnitPrice, roundMoney, PricingError };
