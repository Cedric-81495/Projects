// backend/routes/productRoutes.js
// PUBLIC, READ-ONLY storefront routes.
// All product writes live in /api/admin/products (productAdminRoutes.js) — the duplicate
// POST/PUT/PATCH/DELETE that used to be here were removed.
const express = require("express");
const Product = require("../models/Product");
const { optionalAuth } = require("../middleware/authMiddleware");
const { validateObjectIdParam } = require("../middleware/validateObjectId");

const router = express.Router();
router.param("id", validateObjectIdParam);

// Customers only ever see published products
const PUBLISHED = { isPublished: true };

const MAX_LIMIT = 100;
const MAX_SEARCH_LENGTH = 100;

// Escape every regex metacharacter so user input is matched literally.
// Prevents regex injection (e.g. "." matching everything) and ReDoS (e.g. "(a+)+$").
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Query values can arrive as arrays (?size=M&size=L). Take them as plain strings only.
const str = (value) => {
  if (Array.isArray(value)) value = value.join(",");
  return typeof value === "string" ? value.trim() : "";
};
const list = (value) =>
  str(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 20);

const SORTS = {
  priceAsc: { price: 1 },
  priceDesc: { price: -1 },
  popularity: { rating: -1 },
};

// @route GET /api/products
// @desc Get published products with optional filters
// @access Public
router.get("/", async (req, res) => {
  try {
    const q = req.query;
    const query = { ...PUBLISHED };

    const collection = str(q.collection);
    if (collection && collection.toLowerCase() !== "all") query.collections = collection;

    const category = str(q.category);
    if (category && category.toLowerCase() !== "all") query.category = category;

    const materials = list(q.material);
    if (materials.length) query.material = { $in: materials };

    const brands = list(q.brand);
    if (brands.length) query.brand = { $in: brands };

    const sizes = list(q.size).map((s) => s.toUpperCase());
    if (sizes.length) query.sizes = { $in: sizes };

    const color = str(q.color);
    if (color) query.colors = { $in: [color] };

    const gender = str(q.gender);
    if (gender) query.gender = gender;

    const minPrice = Number(str(q.minPrice));
    const maxPrice = Number(str(q.maxPrice));
    if (str(q.minPrice) && Number.isFinite(minPrice)) query.price = { ...query.price, $gte: minPrice };
    if (str(q.maxPrice) && Number.isFinite(maxPrice)) query.price = { ...query.price, $lte: maxPrice };

    const search = str(q.search).slice(0, MAX_SEARCH_LENGTH);
    if (search) {
      const pattern = escapeRegex(search);
      query.$or = [
        { name: { $regex: pattern, $options: "i" } },
        { description: { $regex: pattern, $options: "i" } },
      ];
    }

    const sort = SORTS[str(q.sortBy)] || { createdAt: -1 };

    const requested = parseInt(str(q.limit), 10);
    const limit = Number.isFinite(requested) && requested > 0 ? Math.min(requested, MAX_LIMIT) : MAX_LIMIT;

    const products = await Product.find(query).sort(sort).limit(limit);
    res.json(products);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route GET /api/products/best-seller
// @desc Highest-rated published product
// @access Public
router.get("/best-seller", async (req, res) => {
  try {
    const bestSeller = await Product.findOne(PUBLISHED).sort({ rating: -1 });
    if (!bestSeller) {
      return res.status(404).json({ message: "No Best Seller Found" });
    }
    res.json(bestSeller);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route GET /api/products/new-arrivals
// @desc Latest 8 published products
// @access Public
router.get("/new-arrivals", async (req, res) => {
  try {
    const newArrivals = await Product.find(PUBLISHED).sort({ createdAt: -1 }).limit(8);
    res.json(newArrivals);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route GET /api/products/similar/:id
// @desc Similar published products
// @access Public
router.get("/similar/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const similarProducts = await Product.find({
      ...PUBLISHED,
      _id: { $ne: product._id },
      gender: product.gender,
      category: product.category,
    }).limit(4);

    res.json(similarProducts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

// @route GET /api/products/:id
// @desc Get product by ID. Unpublished products are 404 for customers,
//       but visible to admins (the admin edit page loads products through this route).
// @access Public
router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const isAdmin = req.user?.role === "admin";
    const filter = isAdmin ? { _id: req.params.id } : { _id: req.params.id, ...PUBLISHED };

    const product = await Product.findOne(filter);
    if (!product) {
      return res.status(404).json({ message: "Product Not Found" });
    }
    res.json(product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
