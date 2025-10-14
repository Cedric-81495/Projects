// backend/routes/adminRoutes.js
import express from "express";

import {
  createSuperAdmin,
  createAdminBySuperUser,
  updateAdminBySuperUser,
  deleteAdminBySuperUser,
  updateAdminRole,
  updateAdminDetails,
  deleteAdminUser,
} from "../controllers/superAdminController.js";

import { protect, admin, isSuperAdmin } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// 🔸 SuperUser-only CRUD for adminUser accounts
//
router.post("/super-admins/admins", protect, isSuperAdmin, createAdminBySuperUser);
router.put("/super-admins/admins/:id", protect, isSuperAdmin, updateAdminBySuperUser);
router.delete("/super-admins/admins/:id", protect, isSuperAdmin, deleteAdminBySuperUser);

//
// 🔸 SuperUser-only logic for superUser accounts
//
router.post("/super", async (req, res, next) => {
  try {
    const superUserCount = await User.countDocuments({ role: "superUser" });

    if (superUserCount > 0) {
      return protect(req, res, () =>
        isSuperAdmin(req, res, () => createSuperAdmin(req, res, next))
      );
    }

    // No superUser exists yet — allow public creation
    return createSuperAdmin(req, res, next);
  } catch (err) {
    console.error("Error checking superUser count:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Unified route for all admins (adminUser + superUser)
router.get("/all", protect, admin, async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ["adminUser", "superUser"] },
    }).select("-password");

    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching all admins:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/super", protect, isSuperAdmin);
router.put("/super-admins/:id/role", protect, isSuperAdmin, updateAdminRole);
router.put("/super-admins/:id", protect, isSuperAdmin, updateAdminDetails);
router.delete("/super-admins/:id", protect, isSuperAdmin, deleteAdminUser);

export default router;