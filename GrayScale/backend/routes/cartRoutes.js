const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Helpers 
const getCart = async (userId, guestId) => {
  let cart = null;
  // First, try to find a cart associated with the userId
  if (userId) {
    cart = await Cart.findOne({ user: userId });
  }
  // If no user cart was found (cart is still null), or if userId was not provided,
  // AND guestId is provided, then try to find a cart associated with the guestId
  if (!cart && guestId) {
    cart = await Cart.findOne({ guestId: guestId });
  }
  return cart;
};


// ADD TO CART
router.post("/", async (req, res) => {
  const { productId, quantity, size, color, guestId, userId } = req.body;
  const qty = Number(quantity ?? 1);

  if (!productId || !size || !color || !Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ message: "Missing or invalid fields" });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await getCart(userId, guestId);

    if (cart) {
      //  Add userId but keep guestId
      if (userId && !cart.user) {
        cart.user = userId;
        // Removed: `delete cart.guestId;` to keep guestId in the document
      }

      const productIndex = cart.products.findIndex(
        (p) =>
          p.productId.toString() === String(productId) &&
          p.size === size &&
          p.color === color
      );

      if (productIndex >= 0) {
        cart.products[productIndex].quantity += qty;
      } else {
        cart.products.push({
          productId,
          name: product.name,
          image: product.images?.[0]?.url || "",
          price: product.price,
          size,
          color,
          quantity: qty,
        });
      }

      cart.totalPrice = cart.products.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );

      await cart.save();
      return res.status(200).json(cart);
    }

    // If no cart found, create a new one
    const newCart = await Cart.create({
      user: userId || undefined,
      // If userId is present, guestId should not be set for a new cart unless explicitly desired
      // For new cart, if userId is present, we typically wouldn't set guestId.
      // If you want both on a *new* cart, you'd set guestId here even if userId is present.
      guestId: userId ? undefined : (guestId || `guest_${Date.now()}`), 
      products: [
        {
          productId,
          name: product.name,
          image: product.images?.[0]?.url || "",
          price: product.price,
          size,
          color,
          quantity: qty,
        },
      ],
      totalPrice: product.price * qty,
    });

    res.status(201).json(newCart);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});


// @route PUT /api/cart
// @desc Update product quantity in the cart for a guest or logged-in user
// @access Public
router.put("/", async (req, res) => {
    const { productId, quantity, size, color, guestId, userId } = req.body;
    const qty = Number(quantity);

    if (!productId || !size || !color || !Number.isFinite(qty)) {
        return res.status(400).json({ message: "Missing or invalid fields" });
    }

    try {
        let cart = await getCart(userId, guestId);
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        // Migrate guest cart to user cart if userId is provided, KEEPING guestId
        if (userId && !cart.user) {
            cart.user = userId;
            // Removed: `delete cart.guestId;` to keep guestId in the document
        }

        const productIndex = cart.products.findIndex(
            (p) =>
                p.productId.toString() === String(productId) &&
                p.size === size &&
                p.color === color
        );

        if (productIndex < 0) {
            return res.status(404).json({ message: "Product not found in cart" });
        }

        if (qty <= 0) {
            cart.products.splice(productIndex, 1);
        } else {
            cart.products[productIndex].quantity = qty;
        }

        cart.totalPrice = cart.products.reduce(
            (acc, item) => acc + item.price * item.quantity,
            0
        );
        
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
router.delete("/", async (req, res) => {
    const { productId, size, color, guestId, userId } = req.body;

    if (!productId || !size || !color) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        let cart = await getCart(userId, guestId);

        if (!cart) return res.status(404).json({ message: "Cart not found" });

        // Migrate guest cart to user cart if userId is provided, KEEPING guestId
        if (userId && !cart.user) {
            cart.user = userId;
            // Removed: `delete cart.guestId;` to keep guestId in the document
        }

        const productIndex = cart.products.findIndex(
            (p) =>
                p.productId.toString() === String(productId) &&
                p.size === size &&
                p.color === color
        );

        if (productIndex < 0) {
            return res.status(404).json({ message: "Product not found in cart" });
        }

        cart.products.splice(productIndex, 1);

        cart.totalPrice = cart.products.reduce(
            (acc, item) => acc + item.price * item.quantity,
            0
        );

        await cart.save();
        return res.status(200).json(cart);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error" });
    }
});

// @route GET /api/cart
// @desc Get guest or logged-in user' cart
// @access Public
router.get("/", async (req, res) => {
   const { userId, guestId } = req.query;
   
   try {
    const cart = await getCart(userId, guestId);
    if (cart) {
        res.json(cart);
    } else {
        res.status(404).json({ message: "Cart not found" });
    }
   } catch (error) {
        console.log(error);
        res.status(500).json({ message: "server error" });
   }
});

// @route POSt /api/cart/
// @desc Merge guest  cart into user' cart on login
// @access Public
router.post("/merge", protect, async (req, res) => {
    const { guestId } = req.body;

    try {
        // Find the guest cart and user cart
        const guestCart = await Cart.findOne({ guestId });
        const userCart = await Cart.findOne({ user: req.user._id });

        if (guestCart) {
           if (guestCart.products.length === 0) {
            return res.status(400).json({ message: "Guest cart is empty "});
           }

           if (userCart) {
            // Merge guest cart into user cart
            guestCart.products.forEach((guestItem) => {
                const productIndex = userCart.products.findIndex(
                    (item) => 
                        item.productId.toString() === guestItem.productId.toString() &&
                        item.size === guestItem.size &&
                        item.color === guestItem.color
                );

                if (productIndex > -1) {
                    // if the items exist in the user cart, update the quantity
                    userCart.products[productIndex].quantity += guestItem.quantity;
                } else {
                    // Otherwise, add the guest item to the cart
                    userCart.products.push(guestItem);
                }
            });

            userCart.totalPrice = userCart.products.reduce(
                (acc, item) => acc + item.price * item.quantity,
            0
            );
            await userCart.save();

            // Remove the guest cart after merging
            try {
                await Cart.findOneAndDelete({ guestId });
            } catch (error) {
                console.log("Error deleting guest cart", error);
            }
            res.status(200).json(userCart)
           } else {
            // if the user has no guest cart, assign the guest cart to the user
            guestCart.user = req.user._id;
            guestCart.guestId = undefined;
            await guestCart.save();

            res.status(200).json(guestCart);
           }
        } else {
            if (userCart) {
                // Guest cart has already been merged, return user cart
                return res.status(200).json(userCart);
            }

            res.status(404).json({ message: "Guest cart not found "});
        }   
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error"});
    }
});

module.exports = router;