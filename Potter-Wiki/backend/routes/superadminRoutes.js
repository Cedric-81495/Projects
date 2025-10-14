// backend/routes/superadminRoutes.js
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

// 🔐 Token generator
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ✅ Create a super admin manually
const createSuperAdmin = asyncHandler(async (req, res) => {
  const { firstname, middlename, lastname, username, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error("Super admin already exists");
  }

  const superAdmin = await User.create({
    firstname,
    middlename,
    lastname,
    username,
    email,
    password,
    role: "superUser",
  });

  res.status(201).json({
    _id: superAdmin._id,
    firstname: superAdmin.firstname,
    middlename: superAdmin.middlename,
    lastname: superAdmin.lastname,
    username: superAdmin.username,
    email: superAdmin.email,
    role: superAdmin.role,
    token: generateToken(superAdmin._id, superAdmin.role),
  });
});

// ✅ Update any admin/superUser role
const updateAdminRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!["adminUser", "superUser"].includes(role)) {
    res.status(400);
    throw new Error("Invalid role");
  }

  const user = await User.findById(req.params.id);
  if (!user || !["adminUser", "superUser"].includes(user.role)) {
    res.status(404);
    throw new Error("Target user is not an admin");
  }

  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot change your own role");
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    message: `User ${user.username} role updated to ${role}`,
    updatedUser: {
      _id: user._id,
      username: user.username,
      role: user.role,
    },
  });
});

// ✅ Update any admin/superUser details
const updateAdminDetails = asyncHandler(async (req, res) => {
  const { firstname, lastname, email, role } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) throw new Error("User not found");

  user.firstname = firstname || user.firstname;
  user.lastname = lastname || user.lastname;
  user.email = email || user.email;
  user.role = role || user.role;

  await user.save();
  res.status(200).json({ message: "Admin updated", user });
});

// ✅ Delete any admin or super admin
const deleteAdminUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user || !["adminUser", "superUser"].includes(user.role)) {
    res.status(404);
    throw new Error("Target user is not an admin or super admin");
  }

  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot delete your own account");
  }

  await user.deleteOne();
  res.status(200).json({ message: `User ${user.username} deleted successfully` });
});

export {
  createSuperAdmin,
  updateAdminRole,
  updateAdminDetails,
  deleteAdminUser,
};