// backend/controllers/authController.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ===============================
// 📌 LOCAL AUTH (Admins or Users)
// ===============================

// @desc Register user (local - admin/public)
export const registerUser = async (req, res) => {
  try {
    const { firstname, middlename, lastname, username, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      firstname,
      middlename,
      lastname,
      username,
      email,
      password: hashedPassword,
      role: role || "adminUser",
    });

    res.status(201).json({
      _id: user._id,
      firstname: user.firstname,
      middlename: user.middlename,
      lastname: user.lastname,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (err) {
    console.error("Register error:", err.message || err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Login user (local - admin/public)
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.password) {
      return res.status(403).json({
        message: "This account was created with Google. Please log in with Google instead.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    res.json({
      _id: user._id,
      firstname: user.firstname,
      middlename: user.middlename,
      lastname: user.lastname,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (err) {
    console.error("Login error:", err.message || err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// 📌 GOOGLE AUTH (Public Users)
// ===============================

export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ email });

    // Handle local vs Google accounts
    if (user && user.password && !user.googleId) {
      return res.status(400).json({
        message: "This email is registered with a password. Please use local login instead.",
      });
    }

    // If new user, create
    if (!user) {
      const [firstname, lastname = ""] = name?.split(" ") || [];
      const username = email.split("@")[0];
      user = await User.create({
        firstname,
        lastname,
        email,
        googleId,
        username,
        password: null,
        role: "publicUser",
      });
      console.log(`🆕 Registered new Google user: ${email}`);
    } else {
      console.log(`✅ Logged in existing Google user: ${email}`);
      // Update missing googleId if needed
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    // Issue your JWT
    const jwtToken = generateToken(user._id, user.role);
    res.status(200).json({ user, token: jwtToken });
  } catch (err) {
    console.error("Google auth error:", err.message || err);
    res.status(500).json({ message: "Server error during Google authentication" });
  }
};
