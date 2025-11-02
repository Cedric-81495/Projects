// backend/controllers/moviesController.js
import asyncHandler from "express-async-handler";
import Movie from "../models/Movie.js";

// @desc Get all movies
// @route GET /api/movies
// @access Public
export const getMovies = asyncHandler(async (req, res) => {
  const movies = await Movie.find({}).sort({ release_date: -1 }); // 🆕 sort descending
  res.json(movies);
});

// @desc Create new character
// @route POST /api/movies
// @access Admin
export const createMovie = asyncHandler(async (req, res) => {
  const newMovie = new Movie(req.body);
  const savedMovie = await newMovie.save();
  res.status(201).json(savedMovie);
});

// @desc Update character
// @route PUT /api/movies/:id
// @access Admin
export const updateMovie = asyncHandler(async (req, res) => {
  const updated = await Movie.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // ✅ Return the updated doc
  });

  if (!updated) {
    res.status(404);
    throw new Error("Movie not found");
  }

  res.json(updated);
});

// @desc Delete character
// @route DELETE /api/movies/:id
// @access Admin
export const deleteMovie = asyncHandler(async (req, res) => {
  const deleted = await Movie.findByIdAndDelete(req.params.id);
  if (!deleted) {
    res.status(404);
    throw new Error("Movie not found");
  }

  res.json({ message: "Movie removed" });
});
