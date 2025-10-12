// backend/routes/staffRoutes.js
import express from "express";
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} from "../controllers/staffController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(getStaff) // public access
  .post(protect, admin, createStaff); // only admin can add staff

router.route("/:id")
  .put(protect, admin, updateStaff) // only admin can update
  .delete(protect, admin, deleteStaff); // only admin can delete

export default router;
