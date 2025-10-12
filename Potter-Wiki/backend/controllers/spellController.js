// backend/controllers/spellController.js
import asyncHandler from "express-async-handler";
import Spell from "../models/Spell.js";

// @desc    Get all spells
// @route   GET /api/spells
// @access  Public
const getSpells = asyncHandler(async (req, res) => {
  const spells = await Spell.find(); // fetch all spells
  res.status(200).json(spells);
});

// @desc    Create new spell
// @route   POST /api/spells
// @access  Private/Admin
const createSpell = asyncHandler(async (req, res) => {
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
const updateSpell = asyncHandler(async (req, res) => {
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
const deleteSpell = asyncHandler(async (req, res) => {
  const spell = await Spell.findById(req.params.id);

  if (spell) {
    await spell.remove();
    res.status(200).json({ message: `Spell ${req.params.id} deleted` });
  } else {
    res.status(404);
    throw new Error("Spell not found");
  }
});

export { getSpells, createSpell, updateSpell, deleteSpell };
