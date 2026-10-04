const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const { getUnitPrice } = require("../services/pricingService");

const router = express.Router();

// SECURITY: `userId` sent in the body/query is IGNORED everywhere in this file.
// Logged-in identity comes only from the JWT (req.user via optionalAuth).
// Guests are identified by guestId, and a guestId can only reach carts that do NOT
// belong to a user, so knowing someone's guestId never exposes their account cart.

const GUEST_ID_PATTERN = /^guest_[A-Za-z0-9-]{8,64}$/;
const isValidGuestId = (id) => typeof id === "string" && GUEST_ID_PATTERN.test(id);
const newGuestId = () => `guest_${crypto.randomUUID()}`;

// Find the cart for whoever is making the request
const getCart = async (req, guestId) => {
  if (req.user) {
    return Cart.findOne({ user: req.user._id });
  }
  if (isValidGuestId(guestId)) {
    return Cart.findOne({ guestId, user: null });
  }
  return null;
};

const recalcTotal = (cart) => {
  cart.totalPrice = cart.products.reduce((acc, item) => acc + item.price * item.quantity, 0);
};

// Cart lines store a price snapshot from when they were added. Refresh them so the cart
// always shows today's price (sale started/ended, admin edited price, product deleted).
const refreshCartPrices = async (cart) => {
  if (!cart || cart.products.length === 0) return cart;

  const ids = [...new Set(cart.products.map((p) => String(p.productId)))];
  const products = await Product.find({ _id: { $in: ids } });
  const byId = new Map(products.map((p) => [String(p._id), p]));

  let changed = false;
  cart.products = cart.products.filter((line) => {
    const product = byId.get(String(line.productId));
    if (!product || !product.isPublished) {
      changed = true; // product was deleted or unpublished
      return false;
    }
    const price = getUnitPrice(product);
    if (line.price !== price || line.name !== product.name) {
      line.price = price;
      line.name = product.name;
      line.image = product.images?.[0]?.url || line.image;
      changed = true;
    }
    return true;
  });

  if (changed) {
    recalcTotal(cart);
    await cart.save();
  }
  return cart;
};

const findLine = (cart, productId, size, color) =>
  cart.products.findIndex(
    (p) => p.productId.toString() === String(productId) && p.size === size && p.color === color
  );

// @route POST /api/cart
// @desc Add a product to the cart (guest or logged-in)
// @access Public
router.post("/", optionalAuth, async (req, res) => {
  const { productId, quantity, size, color, guestId } = req.body;
  const qty = Number(quantity ?? 1);

  if (
    !mongoose.Types.ObjectId.isValid(String(productId)) ||
    !size ||
    !color ||
    !Number.isInteger(qty) ||
    qty <= 0 ||
    qty > 99
  ) {
    return res.status(400).json({ message: "Missing or invalid fields" });
  }

  try {
    const product = await Product.findById(productId);
    if (!product || !product.isPublished) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (!product.sizes.includes(size) || !product.colors.includes(color)) {
      return res.status(400).json({ message: "Invalid size or color" });
    }

    let cart = await getCart(req, guestId);

    // Stock check: everything of this product already in the cart + what's being added
    const alreadyInCart = (cart?.products || [])
      .filter((p) => p.productId.toString() === String(productId))
      .reduce((sum, p) => sum + p.quantity, 0);
    if (alreadyInCart + qty > product.countInStock) {
      const left = Math.max(product.countInStock - alreadyInCart, 0);
      return res.status(400).json({
        message: left > 0 ? `Only ${left} more available` : "This item is out of stock",
      });
    }

    if (cart) {
      const index = findLine(cart, productId, size, color);
      if (index >= 0) {
        cart.products[index].quantity += qty;
      } else {
        cart.products.push({
          productId,
          name: product.name,
          image: product.images?.[0]?.url || "",
          price: getUnitPrice(product),
          size,
          color,
          quantity: qty,
        });
      }
      recalcTotal(cart);
      await cart.save();
      return res.status(200).json(cart);
    }

    // No cart yet -> create one for this user or guest
    cart = await Cart.create({
      user: req.user ? req.user._id : undefined,
      guestId: req.user ? undefined : isValidGuestId(guestId) ? guestId : newGuestId(),
      products: [
        {
          productId,
          name: product.name,
          image: product.images?.[0]?.url || "",
          price: getUnitPrice(product),
          size,
          color,
          quantity: qty,
        },
      ],
      totalPrice: getUnitPrice(product) * qty,
    });

    res.status(201).json(cart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route PUT /api/cart
// @desc Update product quantity in the cart
// @access Public
router.put("/", optionalAuth, async (req, res) => {
  const { productId, quantity, size, color, guestId } = req.body;
  const qty = Number(quantity);

  if (!productId || !size || !color || !Number.isInteger(qty) || qty > 99) {
    return res.status(400).json({ message: "Missing or invalid fields" });
  }

  try {
    const cart = await getCart(req, guestId);
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const index = findLine(cart, productId, size, color);
    if (index < 0) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    if (qty <= 0) {
      cart.products.splice(index, 1);
    } else {
      const product = await Product.findById(productId);
      const otherLines = cart.products
        .filter((p, i) => i !== index && p.productId.toString() === String(productId))
        .reduce((sum, p) => sum + p.quantity, 0);
      if (!product || otherLines + qty > product.countInStock) {
        const left = Math.max((product?.countInStock || 0) - otherLines, 0);
        return res.status(400).json({ message: `Only ${left} available` });
      }
      cart.products[index].quantity = qty;
    }

    recalcTotal(cart);
    await cart.save();
    return res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route DELETE /api/cart
// @desc Remove a specific line item from the cart
// @access Public
router.delete("/", optionalAuth, async (req, res) => {
  const { productId, size, color, guestId } = req.body || {};

  if (!productId || !size || !color) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const cart = await getCart(req, guestId);
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const index = findLine(cart, productId, size, color);
    if (index < 0) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    cart.products.splice(index, 1);
    recalcTotal(cart);
    await cart.save();
    return res.status(200).json(cart);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
});

// @route GET /api/cart
// @desc Get the current user's cart (from token) or a guest cart (from guestId)
// @access Public
router.get("/", optionalAuth, async (req, res) => {
  try {
    const cart = await refreshCartPrices(await getCart(req, req.query.guestId));
    // No cart yet (e.g. a first-time visitor) is normal, not an error: return an empty cart.
    // Nothing is saved until the first item is added.
    res.json(cart || { products: [], totalPrice: 0 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/cart/merge
// @desc Merge guest cart into the logged-in user's cart
// @access Private
router.post("/merge", protect, async (req, res) => {
  const { guestId } = req.body;

  try {
    // Only unowned guest carts can be merged
    const guestCart = isValidGuestId(guestId)
      ? await Cart.findOne({ guestId, user: null })
      : null;
    const userCart = await Cart.findOne({ user: req.user._id });

    if (!guestCart || guestCart.products.length === 0) {
      if (guestCart) await guestCart.deleteOne();
      if (userCart) return res.status(200).json(userCart);
      return res.status(404).json({ message: "Guest cart not found" });
    }

    if (userCart) {
      guestCart.products.forEach((guestItem) => {
        const index = findLine(userCart, guestItem.productId, guestItem.size, guestItem.color);
        if (index > -1) {
          userCart.products[index].quantity += guestItem.quantity;
        } else {
          userCart.products.push(guestItem);
        }
      });
      recalcTotal(userCart);
      await userCart.save();
      await guestCart.deleteOne();
      return res.status(200).json(userCart);
    }

    // User has no cart yet -> adopt the guest cart
    guestCart.user = req.user._id;
    guestCart.guestId = undefined;
    await guestCart.save();
    res.status(200).json(guestCart);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
