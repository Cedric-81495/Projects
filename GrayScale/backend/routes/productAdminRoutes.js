const express = require("express");
const Product = require("../models/Product");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// @route GET /api/admin/products
// @desc Get All Products
// @access Private/Admin
router.get("/", protect, admin, async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch(error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// @route POST /api/admin/products
// @desc  Create a product
// @access Private/Admin
router.post("/", protect, admin, async (req, res) => {
    try {
         const { 
                name, 
                description, 
                price, 
                discountPrice, 
                countInStock, 
                category, 
                brand, 
                sizes, 
                colors, 
                collections, 
                material, 
                gender, 
                images,
                isFeatured, 
                isPublished, 
                tags, 
                dimensions, 
                weight,
                sku,
            } = req.body;

            const product = new Product({     
                name, 
                description, 
                price, 
                discountPrice, 
                countInStock, 
                category, 
                brand, sizes, 
                colors, 
                collections, 
                material, 
                gender, 
                images,
                isFeatured, 
                isPublished, 
                tags, 
                dimensions, 
                weight,
                sku,
                user: req.user._id, // Reference to the admin user who created the product.
            });
            const createdProduct = await product.save();
            res.status(201).json({ message: "Product created successfully" });
    } catch(error) {
            console.log(error);
            res.status(500).json({ message: "Server Error" });
    }
});

// @route PUT /admin/products/:id
// @desc   Update a product by id
// @access  Private/Admin

router.put("/:id", protect, admin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.name = req.body.name || product.name; 
            product.description = req.body.description || product.description; 
            product.price = req.body.price || product.price; 
            product.discountPrice = req.body.discountPrice || product.discountPrice; 
            product.countInStock = req.body.countInStock || product.countInStock; 
            product.category = req.body.category || product.category; 
            product.brand = req.body.brand || product.brand; 
            product.sizes = req.body.sizes || product.sizes; 
            product.colors = req.body.colors || product.colors; 
            product.collections = req.body.collections || product.collections; 
            product.material = req.body.material || product.material; 
            product.gender = req.body.gender || product.gender; 
            product.images = req.body.images || product.images;
            product.isFeatured = req.body.isFeatured || product.isFeatured; 
            product.isPublished = req.body.isPublished || product.isPublished; 
            product.tags = req.body.tags || product.tags; 
            product.dimensions = req.body.dimensions || product.dimensions; 
            product.weight = req.body.weight || product.weight;
            product.sku = req.body.sku || product.sku;
            
            const updatedProduct = await product.save();
            res.status(201).json({ message: "Product updated successfully", product: updatedProduct });
        }
    } catch(error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// @route DELETE /api/admin/products/:id
// @desc Delete product by ID
// @access Private/Admin
router.delete("/:id", protect, admin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            const deletedProduct = await product.deleteOne();
            res.status(201).json({ message: "Product deleted successfully" });
        } else {
            res.status(404).json({ message: "Product not found" });
        }
    } catch(error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;