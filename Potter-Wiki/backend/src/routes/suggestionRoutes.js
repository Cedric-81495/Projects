import express from "express";
import {
  createSuggestion,
  getUserSuggestions,
  updateSuggestion,
  deleteSuggestion,
} from "../controllers/suggestionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .post(protect, createSuggestion)
  .get(protect, getUserSuggestions);

router.route("/:id")
  .put(protect, updateSuggestion)
  .delete(protect, deleteSuggestion);

export default router;