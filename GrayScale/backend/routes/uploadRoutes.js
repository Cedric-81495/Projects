const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// Cloudinary Configuration (env is loaded once in server.js)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Multer: memory storage, size limit, images only
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
        const err = new Error("Only JPEG, PNG, WEBP or GIF images are allowed");
        err.code = "INVALID_FILE_TYPE";
        return cb(err);
    },
}).single("image");

// Run multer inside the handler so its errors become clean 400s instead of 500s
const handleUpload = (req, res) =>
    new Promise((resolve, reject) => {
        upload(req, res, (err) => (err ? reject(err) : resolve()));
    });

const streamUpload = (fileBuffer) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "grayscale/products", resource_type: "image" },
            (error, result) => (result ? resolve(result) : reject(error))
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
    });

// @route POST /api/upload
// @desc Upload a product image to Cloudinary
// @access Private/Admin
router.post("/", protect, admin, async (req, res) => {
    try {
        await handleUpload(req, res);
    } catch (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ message: "Image must be 5 MB or smaller" });
        }
        if (err.code === "INVALID_FILE_TYPE" || err instanceof multer.MulterError) {
            return res.status(400).json({ message: err.message });
        }
        console.error("Upload parse error:", err.message);
        return res.status(400).json({ message: "Invalid upload" });
    }

    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    try {
        const result = await streamUpload(req.file.buffer);
        if (!result?.secure_url) throw new Error("No URL from Cloudinary");
        res.json({ imageUrl: result.secure_url });
    } catch (error) {
        // Log only the message — never log credentials or the raw file
        console.error("Cloudinary upload failed:", error?.message || error);
        res.status(500).json({ message: "Image upload failed" });
    }
});

module.exports = router;
