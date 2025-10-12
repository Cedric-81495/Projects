// backend/controllers/staffController.js
import asyncHandler from "express-async-handler";
import Staff from "../models/Staff.js";

// @desc Get all staff members
// @route GET /api/staff
// @access Public
const getStaff = asyncHandler(async (req, res) => {
  const staffMembers = await Staff.find({});
  res.status(200).json(staffMembers);
});

// @desc Create a new staff member
// @route POST /api/staff
// @access Private/Admin
const createStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.create(req.body);
  res.status(201).json(staff);
});

// @desc Update a staff member
// @route PUT /api/staff/:id
// @access Private/Admin
const updateStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.status(200).json(staff);
});

// @desc Delete a staff member
// @route DELETE /api/staff/:id
// @access Private/Admin
const deleteStaff = asyncHandler(async (req, res) => {
  await Staff.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "Staff deleted" });
});

export { getStaff, createStaff, updateStaff, deleteStaff };
