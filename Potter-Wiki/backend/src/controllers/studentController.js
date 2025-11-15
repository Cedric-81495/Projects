// backend/controllers/studentController.js
import asyncHandler from "express-async-handler";
import Student from "../models/Student.js"; // ✅ make sure path is correct

// @desc    Get all students
// @route   GET /api/students
// @access  Public
const getStudents = asyncHandler(async (req, res) => {
  const students = await Student.find(); // fetch all students
  res.status(200).json({ students });
});

// @desc    Get a single student by ID
// @route   GET /api/students/:id
// @access  Public
const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  res.status(200).json(student);
});

// @desc    Create new student
// @route   POST /api/students
// @access  Private/Admin
const createStudent = asyncHandler(async (req, res) => {
  res.status(201).json({ message: "Student created" });
});

// @desc    Update a student
// @route   PUT /api/students/:id
// @access  Private/Admin
const updateStudent = asyncHandler(async (req, res) => {
  res.status(200).json({ message: `Student ${req.params.id} updated` });
});

// @desc    Delete a student
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = asyncHandler(async (req, res) => {
  res.status(200).json({ message: `Student ${req.params.id} deleted` });
});

export {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};