const express = require("express");
const User = require("../models/User");
const { protect, admin } = require("../middleware/authMiddleware");
const { validateObjectIdParam } = require("../middleware/validateObjectId");

const router = express.Router();
router.param("id", validateObjectIdParam);

const ROLES = ["customer", "admin"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const safeUser = (user) => {
    const { password, ...rest } = user.toObject();
    return rest;
};

// Would this change leave the store with zero admins?
const isLastAdmin = async (user) =>
    user.role === "admin" && (await User.countDocuments({ role: "admin" })) <= 1;

// @route GET /api/admin/users
// @desc Get all users (without password hashes)
// @access Private/Admin
router.get("/", protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select("-password").sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// @route POST /api/admin/users
// @desc Add a new user (admin only)
// @access Private/Admin
router.post("/", protect, admin, async (req, res) => {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const role = req.body?.role || "customer";

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (name.length > 100) {
        return res.status(400).json({ message: "Name is too long" });
    }
    if (!EMAIL_PATTERN.test(email)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
    }
    if (password.length < 6 || password.length > 128) {
        return res.status(400).json({ message: "Password must be between 6 and 128 characters" });
    }
    if (!ROLES.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
    }

    try {
        if (await User.findOne({ email })) {
            return res.status(400).json({ message: "User already exists" });
        }

        const user = await User.create({ name, email, password, role, provider: "local" });
        res.status(201).json({ message: "User created successfully", user: safeUser(user) });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "User already exists" });
        }
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// @route PUT /api/admin/users/:id
// @desc Update user info (admin only)
// @access Private/Admin
router.put("/:id", protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { name, email, role } = req.body || {};

        if (name !== undefined) {
            const clean = String(name).trim();
            if (!clean || clean.length > 100) {
                return res.status(400).json({ message: "Invalid name" });
            }
            user.name = clean;
        }

        if (email !== undefined) {
            const clean = String(email).trim().toLowerCase();
            if (!EMAIL_PATTERN.test(clean)) {
                return res.status(400).json({ message: "Please enter a valid email address" });
            }
            const taken = await User.findOne({ email: clean, _id: { $ne: user._id } });
            if (taken) {
                return res.status(400).json({ message: "Email is already in use" });
            }
            user.email = clean;
        }

        if (role !== undefined && role !== user.role) {
            if (!ROLES.includes(role)) {
                return res.status(400).json({ message: "Invalid role" });
            }
            if (String(user._id) === String(req.user._id)) {
                return res.status(400).json({ message: "You can't change your own role" });
            }
            if (await isLastAdmin(user)) {
                return res.status(400).json({ message: "Can't demote the last admin" });
            }
            user.role = role;
        }

        const updatedUser = await user.save();
        res.status(200).json({ message: "User updated successfully", user: safeUser(updatedUser) });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Email is already in use" });
        }
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// @route DELETE /api/admin/users/:id
// @desc Delete a user (admin only)
// @access Private/Admin
router.delete("/:id", protect, admin, async (req, res) => {
    try {
        if (String(req.params.id) === String(req.user._id)) {
            return res.status(400).json({ message: "You can't delete your own account" });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (await isLastAdmin(user)) {
            return res.status(400).json({ message: "Can't delete the last admin" });
        }

        await user.deleteOne();
        res.status(200).json({ message: "User deleted successfully", userId: user._id });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
