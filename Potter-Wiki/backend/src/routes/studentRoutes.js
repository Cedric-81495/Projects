// backend/routes/studentRoutes.js
import express from "express";
import {
  getStudents,
  getStudentById, // ✅ newly added
  createStudent,
  updateStudent,
  deleteStudent
} from "../controllers/studentController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(getStudents)               // public
  .post(protect, admin, createStudent); // admin only

router.route("/:id")
  .get(getStudentById)           // ✅ public access to single student
  .put(protect, admin, updateStudent)
  .delete(protect, admin, deleteStudent);

export default router;