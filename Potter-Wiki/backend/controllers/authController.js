// backend/controllers/authController.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

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
    console.error("Register error:", err);
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
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// 📌 GOOGLE AUTH (Public Users)
// ===============================

// @desc Register user via Google
export const googleRegister = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Account already exists" });

    const [firstname, lastname] = name.split(" ");
    const newUser = await User.create({
      firstname,
      lastname,
      email,
      googleId,
      password: null,
      role: "publicUser",
    });

    const jwtToken = generateToken(newUser._id, newUser.role);
    res.status(201).json({ user: newUser, token: jwtToken });
  } catch (err) {
    console.error("Google register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Login user via Google
export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      const [firstname, lastname] = name.split(" ");
      user = await User.create({
        firstname,
        lastname,
        email,
        googleId,
        password: null,
        role: "publicUser",
      });
    }

    const jwtToken = generateToken(user._id, user.role);
    res.status(200).json({ user, token: jwtToken });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};