// backend/routes/registerRoutes.js
import express from "express";
import { registerAdmin } from "../controllers/adminController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { adminRegistrationRules } from "../validators/adminValidators.js

const router = express.Router();

// 🔓 Public registration route for adminUser
router.post("/register", adminRegistrationRules, validateRequest, registerAdmin);

export default router;