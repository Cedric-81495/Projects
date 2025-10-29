// backend/controllers/charactersController.js
import asyncHandler from "express-async-handler";
import Character from "../models/Character.js";

// @desc Get all characters
// @route GET /api/characters
// @access Public
export const getCharacters = asyncHandler(async (req, res) => {
  const characters = await Character.find({});
  res.json(characters);
});

// @desc Create new character
// @route POST /api/characters
// @access Admin
export const createCharacter = asyncHandler(async (req, res) => {
  const newCharacter = new Character(req.body);
  const savedCharacter = await newCharacter.save();
  res.status(201).json(savedCharacter);
});

// @desc Update character
// @route PUT /api/characters/:id
// @access Admin
export const updateCharacter = asyncHandler(async (req, res) => {
  const updated = await Character.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // ✅ Return the updated doc
  });

  if (!updated) {
    res.status(404);
    throw new Error("Character not found");
  }

  res.json(updated);
});

// @desc Delete character
// @route DELETE /api/characters/:id
// @access Admin
export const deleteCharacter = asyncHandler(async (req, res) => {
  const deleted = await Character.findByIdAndDelete(req.params.id);
  if (!deleted) {
    res.status(404);
    throw new Error("Character not found");
  }

  res.json({ message: "Character removed" });
});
