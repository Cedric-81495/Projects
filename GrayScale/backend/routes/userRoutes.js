// backend/routes/userRoutes.js
const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { protect } = require("../middleware/authMiddleware");
const {
  loginLimiter,
  loginIpLimiter,
  registerLimiter,
  googleLimiter,
} = require("../middleware/rateLimiters");

const router = express.Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

// Same response shape for every login method
const authResponse = (user) => ({
  user: {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  },
  token: generateToken(user),
});

// Existing accounts may have been saved with mixed-case emails before normalization
const findByEmail = (rawEmail) => {
  const trimmed = String(rawEmail || "").trim();
  return User.findOne({ email: { $in: [...new Set([trimmed, trimmed.toLowerCase()])] } });
};

// @route POST /api/users/register
// @desc Register a new user
// @access Public (rate limited)
router.post("/register", registerLimiter, async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }
  if (name.length > 100) {
    return res.status(400).json({ message: "Name is too long." });
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return res.status(400).json({ message: "Please enter a valid email address." });
  }
  if (password.length < 6 || password.length > 128) {
    return res
      .status(400)
      .json({ message: "Password must be between 6 and 128 characters long." });
  }

  try {
    if (await findByEmail(email)) {
      return res.status(400).json({ message: "User already exists." });
    }

    const user = await User.create({ name, email, password, provider: "local" });
    res.status(201).json(authResponse(user));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "User already exists." });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/users/login
// @desc Authenticate user
// @access Public (rate limited: per IP+email and per IP)
router.post("/login", loginIpLimiter, loginLimiter, async (req, res) => {
  const email = req.body?.email;
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await findByEmail(email);

    if (!user) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    // Google-only accounts have no password
    if (user.provider === "google" && !user.password) {
      return res.status(401).json({ message: "Please sign in with Google" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    res.json(authResponse(user));
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route POST /api/users/google
// @desc Login/Register with Google (ID token from @react-oauth/google)
// @access Public (rate limited)
router.post("/google", googleLimiter, async (req, res) => {
  const { credential } = req.body || {};
  if (!credential || typeof credential !== "string") {
    return res.status(400).json({ message: "No credential provided" });
  }

  // Fail closed: without an audience, tokens issued to ANY Google app would be accepted
  if (!process.env.GOOGLE_CLIENT_ID) {
    console.error("GOOGLE_CLIENT_ID is not set — Google login disabled");
    return res.status(503).json({ message: "Google login is not configured" });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error) {
    console.error("Google token verification failed:", error.message);
    return res.status(401).json({ message: "Google authentication failed" });
  }

  // Only trust emails Google has verified — otherwise someone could create a Google
  // account with an unverified address and take over the matching GrayScale account.
  if (!payload?.email || payload.email_verified !== true) {
    return res.status(401).json({ message: "Your Google email address is not verified" });
  }

  try {
    const email = normalizeEmail(payload.email);
    let user = await findByEmail(email);

    if (!user) {
      user = await User.create({
        name: String(payload.name || email.split("@")[0]).slice(0, 100),
        email,
        provider: "google",
      });
    }

    res.json(authResponse(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route GET /api/users/profile
// @desc Get logged-in user's profile (Protected Route)
router.get("/profile", protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
