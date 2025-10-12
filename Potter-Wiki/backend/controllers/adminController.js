import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// ======================================================
// 🔐 TOKEN GENERATION
// ======================================================
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ======================================================
// 👤 USER REGISTRATION
// ======================================================

// ✅ Register an admin user
// @route POST /api/admins/register
// @access Private/Admin (or Public for first setup)
const registerAdmin = asyncHandler(async (req, res) => {
  const { firstname, middlename, lastname, username, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error("Admin already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

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
    firstname: admin.firstname,
    middlename: admin.middlename,
    lastname: admin.lastname,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    token: generateToken(admin._id, admin.role),
  });
});

// ✅ Create a super admin manually
// @route POST /api/admins/super
// @access Public (for setup only — secure later)
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

// ======================================================
// 📋 FETCH USERS
// ======================================================

// ✅ Get all admin users
// @route GET /api/admins
// @access Private/Admin
const getAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: "adminUser" }).select("-password");
  res.status(200).json(admins);
});

// ✅ Get all super admins
// @route GET /api/admins/super
// @access Private/SuperUser
export const getSuperAdmins = async (req, res) => {
  try {
    const superAdmins = await User.find({ role: "superUser" }).select("-password");

    if (!superAdmins.length) {
      return res.status(404).json({ message: "No super admins found" });
    }

    console.log("Fetched super admins:", superAdmins);
    res.json(superAdmins);
  } catch (err) {
    console.error("Error in getSuperAdmins:", err.message);
    res.status(500).json({ message: "Failed to fetch super admins" });
  }
};

// ======================================================
// 🔧 UPDATE & DELETE
// ======================================================

// ✅ Update admin role
// @route PUT /api/admins/:id/role
// @access Private/SuperUser
const updateAdminRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!["adminUser", "superUser"].includes(role)) {
    res.status(400);
    throw new Error("Invalid role");
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.role !== "adminUser" && user.role !== "superUser") {
    res.status(403);
    throw new Error("Target user is not an admin");
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

// ✅ Update admin details
// @route PUT /api/admins/:id
// @access Private/SuperUser
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

// ✅ Delete an admin user (admin-only)
// @route DELETE /api/admins/:id
// @access Private/Admin
const deleteAdmin = asyncHandler(async (req, res) => {
  const adminToDelete = await User.findById(req.params.id);

  if (!adminToDelete) {
    res.status(404);
    throw new Error("Admin not found");
  }

  if (adminToDelete._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot delete your own admin account");
  }

  if (adminToDelete.role !== "adminUser") {
    res.status(403);
    throw new Error("This user is not an admin");
  }

  await adminToDelete.deleteOne();
  res.status(200).json({ message: `Admin ${adminToDelete.username} deleted successfully` });
});

// ✅ Delete any admin or super admin (superUser-only)
// @route DELETE /api/admins/:id
// @access Private/SuperUser
const deleteAdminUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.role !== "adminUser" && user.role !== "superUser") {
    res.status(403);
    throw new Error("Target user is not an admin or super admin");
  }

  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot delete your own account");
  }

  await user.deleteOne();
  res.status(200).json({ message: `User ${user.username} deleted successfully` });
});

// ======================================================
// 📦 EXPORTS
// ======================================================
export {
  getAdmins,
  registerAdmin,
  deleteAdmin,
  createSuperAdmin,
  updateAdminRole,
  deleteAdminUser,
  updateAdminDetails,
};

// Let me know if you want to split this into separate modules (e.g. adminController.js vs superAdminController.js) or add logging and audit trails for sensitive actions like deletion and role changes. You're building this out like a pro.
