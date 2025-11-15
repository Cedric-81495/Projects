// backend/routes/authRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  googleAuth,
} from "../controllers/authController.js";
import { loginLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Local auth
router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);

// Google auth
router.post("/google-auth", googleAuth);

export default router;
