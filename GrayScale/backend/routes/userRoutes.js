// backend/routes/userRoutes.js
const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { protect} = require("../middleware/authMiddleware");
const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @route POST /api/users/register
// @desc Register a new user
// @access Public
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate password length
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long." });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists." });
    }

    // Create user
    user = new User({ name, email, password });
    await user.save();

    // Create JWT payload
    const payload = {
      user: {
        id: user._id,
        role: user.role,
      },
    };

    // Sign token
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Send response
    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// @route POST /api/users/login
// @desc Authenticate user
// @access Public
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user)
      return res.status(401).json({ message: "Invalid Credentials" });

    // 🔒 Block Google-only users from password login
    if (user.provider === "google") {
      return res.status(401).json({
        message: "Please sign in with Google",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid Credentials" });

    const payload = {
      user: {
        id: user._id,
        role: user.role,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/users/google
// @desc Login/Register with Google
// @access Public
router.post("/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ message: "No credential provided" });
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email } = ticket.getPayload();

    let user = await User.findOne({ email });

    // Create user if not exists
    if (!user) {
      user = await User.create({
        name,
        email,
        provider: "google",
      });
    }

    const payload = {
      user: {
        id: user._id,
        role: user.role,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Google authentication failed" });
  }
});


// @route GET /api/users/profile
// @desc Get logged-in user's profile (Protected Route)
router.get("/profile", protect, async (req, res) => {
    res.json(req.user);
});

module.exports = router;