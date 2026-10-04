// backend/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const getBearerToken = (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.split(" ")[1];
  return token && token !== "null" && token !== "undefined" ? token : null;
};

// Resolves the user from a token. Returns null if the user no longer exists.
// Throws if the token is invalid or expired.
const resolveUser = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return User.findById(decoded.user.id).select("-password");
};

// Middleware to protect routes (login required)
const protect = async (req, res, next) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token provided" });
  }

  let user;
  try {
    user = await resolveUser(token);
  } catch (error) {
    console.log("Token verification failed:", error.message);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }

  // Token was valid but the account was deleted
  if (!user) {
    return res.status(401).json({ message: "Not authorized, user not found" });
  }

  req.user = user;
  return next();
};

// Middleware for routes that work for both guests and logged-in users (e.g. cart).
// No token -> guest (req.user stays undefined).
// Bad/expired token or deleted user -> 401, so the frontend logs out instead of silently
// acting on the wrong cart.
const optionalAuth = async (req, res, next) => {
  const token = getBearerToken(req);
  if (!token) return next();

  let user;
  try {
    user = await resolveUser(token);
  } catch (error) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
  if (!user) {
    return res.status(401).json({ message: "Not authorized, user not found" });
  }

  req.user = user;
  return next();
};

// Middleware to check if the user is an admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Not authorized as an admin" });
};

module.exports = { protect, optionalAuth, admin };
