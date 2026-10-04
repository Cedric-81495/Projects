const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const { protect } = require("../middleware/authMiddleware");
const { validateObjectIdParam } = require("../middleware/validateObjectId");

const router = express.Router();
router.param("id", validateObjectIdParam); // invalid IDs -> 404, not 500

// @route GET /api/orders/my-orders
// @desc Get logged-in user's orders
// @access Private
router.get("/my-orders", protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// @route GET /api/orders/:id
// @desc Get order details by ID
// @access Private (owner or admin)
router.get("/:id", protect, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ message: "Order not found" });
    }

    try {
        // Customers can only load their own orders; admins can load any.
        const filter = { _id: req.params.id };
        if (req.user.role !== "admin") filter.user = req.user._id;

        const order = await Order.findOne(filter).populate("user", "name email");

        // Same 404 whether it doesn't exist or belongs to someone else,
        // so order IDs can't be probed.
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json(order);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
