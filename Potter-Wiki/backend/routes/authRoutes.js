// backend/routes/authRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  googleLogin,
  googleRegister,
} from "../controllers/authController.js";
import { loginLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Local auth
router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);

// Google auth
router.post("/google-login", googleLogin);
router.post("/google-register", googleRegister);

export default router;
