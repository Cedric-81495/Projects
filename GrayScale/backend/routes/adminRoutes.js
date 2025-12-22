const express = require("express");
const User = require("../models/User");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

// @route GET /api/admin/users
// @desc Get all uers
// @access Private/Admin
router.get("/", protect, admin, async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch(error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
});


// @route POST /api/admin/user
// @desc Add a new user (admin only)
// @access Private/Admin
router.post("/", protect, admin, async (req, res) => {
     const { name, email, password, role} = req.body;
     try {
            let user = await User.findOne({ email });
            // Check if user already exist
            if (user) {
                return res.status(400).json({ message: "User already exist "});
            }
            
            user = new User({
                name,
                email,
                password,
                role: role || "customer",
            });

            await user.save();
            res.status(201).json({ message: "User created successfully" });
    } catch(error) {
            res.status(500).json({ message: "Server Error" });
    } 
});

// @route PUT /api/admin/users/:id
// @desc Update user info (admin only)
// @access Privete/Admin
router.put("/:id", protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if(user){
            // Update or use the same details
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.role = req.body.role || user.role;
            const updatedUser = await user.save();
            res.status(201).json({ message: "User updated succesfully", user: updatedUser });
        } else {
            res.status(404).json({ message: "User not found" });
        }
      
    } catch(error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// @route DELETE /api/admin/users/:id
// @desc DELETE a user (admin only)
// @access Privete/Admin
router.delete("/:id", protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if(user) {
            const deletedUser = await user.deleteOne();
            res.status(201).json({ message: "User delete suscessfully", userid: deletedUser})
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch(error){
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
});


module.exports = router;