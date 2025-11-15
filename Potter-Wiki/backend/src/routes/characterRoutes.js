import express from "express";
import {
  getCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
} from "../controllers/characterController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Public route to fetch all characters
router.route("/")
  .get(getCharacters)
  .post(protect, admin, createCharacter); // Admin only

// ✅ Secure routes for updating/deleting a character
router.route("/:id")
  .put(protect, admin, updateCharacter)
  .delete(protect, admin, deleteCharacter);

export default router;
