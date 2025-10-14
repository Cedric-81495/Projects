// backend/controllers/superAdminController.js
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// 🔐 Token generator
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ✅ Create super admin
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
    firstname,
    middlename,
    lastname,
    username,
    email,
    role: superAdmin.role,
    token: generateToken(superAdmin._id, superAdmin.role),
  });
});

// ✅ Get all super admins
const getSuperAdmins = asyncHandler(async (req, res) => {
  const superAdmins = await User.find({ role: "superUser" }).select("-password");
  if (!superAdmins.length) {
    return res.status(404).json({ message: "No super admins found" });
  }
  res.status(200).json(superAdmins);
});

// ✅ Create adminUser (superUser only)
const createAdminBySuperUser = asyncHandler(async (req, res) => {
  const { firstname, middlename, lastname, username, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error("Admin already exists");
  }

  const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));

  const admin = await User.create({
    firstname,
    middlename,
    lastname,
    username,
    email,
    password: hashedPassword,
    role: "adminUser",
  });

  res.status(201).json({
    _id: admin._id,
    firstname,
    middlename,
    lastname,
    username,
    email,
    role: admin.role,
    token: generateToken(admin._id, admin.role),
  });
});

// ✅ Read all adminUsers
const getAllAdminsBySuperUser = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: "adminUser" }).select("-password");
  res.status(200).json(admins);
});

// ✅ Update adminUser details
const updateAdminBySuperUser = asyncHandler(async (req, res) => {
  const { firstname, middlename, lastname, username, email } = req.body;
  const admin = await User.findById(req.params.id);

  if (!admin || admin.role !== "adminUser") {
    res.status(404);
    throw new Error("Admin not found");
  }

  admin.firstname = firstname || admin.firstname;
  admin.middlename = middlename || admin.middlename;
  admin.lastname = lastname || admin.lastname;
  admin.username = username || admin.username;
  admin.email = email || admin.email;

  await admin.save();
  res.status(200).json({ message: "Admin updated", admin });
});

// ✅ Delete adminUser
const deleteAdminBySuperUser = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.params.id);

  if (!admin || admin.role !== "adminUser") {
    res.status(404);
    throw new Error("Admin not found");
  }

  if (admin._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot delete your own account");
  }

  await admin.deleteOne();
  res.status(200).json({ message: `Admin ${admin.username} deleted successfully` });
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
  getSuperAdmins,
  createAdminBySuperUser,
  getAllAdminsBySuperUser,
  updateAdminBySuperUser,
  deleteAdminBySuperUser,
  updateAdminRole,
  updateAdminDetails,
  deleteAdminUser,
};