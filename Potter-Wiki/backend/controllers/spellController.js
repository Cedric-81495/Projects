// backend/controllers/spellController.js
import asyncHandler from "express-async-handler";
import Spell from "../models/Spell.js";

// @desc    Get all spells
// @route   GET /api/spells
// @access  Public
export  const getSpells = asyncHandler(async (req, res) => {
  const spells = await Spell.find(); // fetch all spells
  res.status(200).json(spells);
});

// @desc    Create new spell
// @route   POST /api/spells
// @access  Private/Admin
export const createSpell = asyncHandler(async (req, res) => {
  const { name, description, level } = req.body;

  const spell = new Spell({
    name,
    description,
    level,
  });

  const createdSpell = await spell.save();
  res.status(201).json(createdSpell);
});

// @desc    Update a spell
// @route   PUT /api/spells/:id
// @access  Private/Admin
export const updateSpell = asyncHandler(async (req, res) => {
  const spell = await Spell.findById(req.params.id);

  if (spell) {
    spell.name = req.body.name || spell.name;
    spell.description = req.body.description || spell.description;
    spell.level = req.body.level || spell.level;

    const updatedSpell = await spell.save();
    res.status(200).json(updatedSpell);
  } else {
    res.status(404);
    throw new Error("Spell not found");
  }
});

// @desc    Delete a spell
// @route   DELETE /api/spells/:id
// @access  Private/Admin
export const deleteSpell = asyncHandler(async (req, res) => {
  const deleted = await Spell.findByIdAndDelete(req.params.id);
  if (!deleted) {
    res.status(404);
    throw new Error("Spell not found");
  }

  res.json({ message: "Spell removed" });
});
