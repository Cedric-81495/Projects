// backend/controllers/publicController.js
import asyncHandler from "express-async-handler";
import User from "../models/User.js";

// @desc Get all public users
// @route GET /api/public/users
// @access Public or Protected (depending on your choice)
export const getPublicUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: "publicUser" }).select("-password");
  res.status(200).json(users);
});


// @desc    Register a public user
// @route   POST /api/public/register
// @access  Public
export const registerPublicUser = asyncHandler(async (req, res) => {
  const { firstname, middlename, lastname, username, email, password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
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
     role: "publicUser",
   });
 

  if (user) {
    res.status(201).json({
      _id: user._id,
      firstname: user.firstname,
      middlename: user.middlename,
      lastname: user.lastname,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});
