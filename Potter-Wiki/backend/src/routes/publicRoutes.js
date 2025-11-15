// backend/routes/publicRoutes.js
import express from "express";
import { registerPublicUser, getPublicUsers  } from "../controllers/publicController.js";

const router = express.Router();

// Public POST route for registration
router.post("/register", registerPublicUser);

// Get all public users
router.get("/users", getPublicUsers);

export default router;