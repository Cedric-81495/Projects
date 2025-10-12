// backend/controllers/characterController.js
import Character from "../models/Character.js";

// GET all characters
export const getCharacters = async (req, res) => {
  const chars = await Character.find({});
  res.json(chars);
};

// POST new character (admin only)
export const createCharacter = async (req, res) => {
  const char = new Character(req.body);
  const created = await char.save();
  res.status(201).json(created);
};

// PUT update character
export const updateCharacter = async (req, res) => {
  const char = await Character.findById(req.params.id);
  if (!char) return res.status(404).json({ message: "Not found" });
  Object.assign(char, req.body);
  const updated = await char.save();
  res.json(updated);
};

// DELETE character
export const deleteCharacter = async (req, res) => {
  const char = await Character.findById(req.params.id);
  if (!char) return res.status(404).json({ message: "Not found" });
  await char.deleteOne();
  res.json({ message: "Character removed" });
};
