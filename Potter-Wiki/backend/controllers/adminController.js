// backend/controllers/adminController.js
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// 🔐 Token generator
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// ✅ Register an admin user
const registerAdmin = asyncHandler(async (req, res) => {
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
    firstname: admin.firstname,
    middlename: admin.middlename,
    lastname: admin.lastname,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    token: generateToken(admin._id, admin.role),
  });
});


export { registerAdmin };