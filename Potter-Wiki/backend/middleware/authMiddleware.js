// backend/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware to protect routes with JWT
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Optional: log decoded token for debugging
      console.log("Decoded token:", decoded);

      // Attach user to request
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error("Token verification failed:", err.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Middleware to restrict access to admin users
export const admin = (req, res, next) => {
  if (req.user && (req.user.role === "adminUser" || req.user.role === "superUser")) {
    next();
  } else {
    return res.status(403).json({ message: "Admin access only" });
  }
};

export const isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === "superUser") {
    next();
  } else {
    res.status(403).json({ message: "Super admin access only" });
  }
};


