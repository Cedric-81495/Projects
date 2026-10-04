const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");
const { validateObjectIdParam } = require("../middleware/validateObjectId");
const {
    pickProductFields,
    applyProductUpdates,
    sendProductError,
} = require("../services/productService");

const router = express.Router();
router.param("id", validateObjectIdParam); // invalid IDs -> 404, not 500

// @route GET /api/admin/products
// @desc Get All Products
// @access Private/Admin
router.get("/", protect, admin, async (req, res) => {
    try {
        const products = await Product.find({}).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        sendProductError(res, error);
    }
});

// @route POST /api/admin/products
// @desc Create a product
// @access Private/Admin
router.post("/", protect, admin, async (req, res) => {
    try {
        const product = new Product({
            ...pickProductFields(req.body),
            user: req.user._id, // admin who created it
        });
        const createdProduct = await product.save();
        // Return the product itself (adminProductSlice pushes action.payload into the list)
        res.status(201).json(createdProduct);
    } catch (error) {
        sendProductError(res, error, "Failed to create product");
    }
});

// @route PUT /api/admin/products/:id
// @desc Update a product by id. Any field present in the body is applied,
//       including 0 / false (stock 0, unpublish, unfeature).
// @access Private/Admin
router.put("/:id", protect, admin, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ message: "Product not found" });
    }
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        applyProductUpdates(product, req.body);
        const updatedProduct = await product.save();

        // Return the product itself (adminProductSlice replaces it by _id)
        res.status(200).json(updatedProduct);
    } catch (error) {
        sendProductError(res, error, "Failed to update product");
    }
});

// @route DELETE /api/admin/products/:id
// @desc Delete product by ID
// @access Private/Admin
router.delete("/:id", protect, admin, async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ message: "Product not found" });
    }
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        await product.deleteOne();
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        sendProductError(res, error);
    }
});

module.exports = router;
