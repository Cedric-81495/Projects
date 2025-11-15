import express from "express";
import {
  getMovies,
  createMovie,
  updateMovie,
  deleteMovie,
} from "../controllers/movieController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Public route to fetch all movies
router.route("/")
  .get(getMovies)
  .post(protect, admin, createMovie); // Admin only

// ✅ Secure routes for updating/deleting a movie
router.route("/:id")
  .put(protect, admin, updateMovie)
  .delete(protect, admin, deleteMovie);

export default router;
