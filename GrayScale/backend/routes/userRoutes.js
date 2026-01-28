// backend/routes/userRoutes.js
const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const generateToken = require("../utils/generateToken");
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
    let user = await User.findOne({ email });
    if (user) {
      return res.status(401).json({ message: "User already exists." });
    }

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
    const token = generateToken(user);

    // Send response ONCE
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
    res.status(500).json({ message: "Password must be between 6 and 12 characters." });
  }
});

// @route POST /api/users/login
// @desc Authenticate user
// @access Public
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try{
        // Find the user by email
        let user = await User.findOne({ email });

        if (!user) return res.status(401).json({ message: "Account does not exist" });
        
        const isMatch = await user.matchPassword(password);

        if (!isMatch) return res.status(401).json({ message: "Invalid Credentials" });

        // Create JWT payload
        const payload = {
        user: {
            id: user._id,
            role: user.role,
        },
        };

        // Sign token
        const token = generateToken(user);


        // Send response ONCE
        res.json({
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        token,
            }
        );

        }catch(error){
            console.log(error);
            res.status(500).json({ message: "Server error" });

    }
});


// @route POST /api/users/google-login
// @desc Login/Register user via Google
// @access Public
router.post("/google-login", async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId, email_verified } = payload;

    if (!email_verified) {
      return res.status(401).json({ message: "Google email not verified" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        isGoogleUser: true,
      });
    }

    const token = generateToken(user);

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
    console.error("Google auth error:", error);
    res.status(401).json({ message: "Invalid Google token" });
  }
});


// @route GET /api/users/profile
// @desc Get logged-in user's profile (Protected Route)
router.get("/profile", protect, async (req, res) => {
    res.json(req.user);
});

module.exports = router;