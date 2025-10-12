// backend/routes/characterRoutes.js
import express from "express";
import { getCharacters, createCharacter, updateCharacter, deleteCharacter } from "../controllers/characterController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(getCharacters)          // public
  .post(protect, admin, createCharacter); // admin only

router.route("/:id")
  .put(protect, admin, updateCharacter)
  .delete(protect, admin, deleteCharacter);

export default router;
