import express from "express";
import { getSpells, createSpell, updateSpell, deleteSpell } from "../controllers/spellController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(getSpells)               // public
  .post(protect, admin, createSpell); // admin only

router.route("/:id")
  .put(protect, admin, updateSpell)
  .delete(protect, admin, deleteSpell);

export default router;
