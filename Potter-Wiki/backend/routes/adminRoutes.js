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

// =========================================================
// 🔸 SuperUser-only CRUD for adminUser accounts
// =========================================================
router.post("/super-admins/admins", protect, isSuperAdmin, createAdminBySuperUser); // Create adminUser
router.put("/super-admins/admins/:id", protect, isSuperAdmin, updateAdminBySuperUser); // Update adminUser
router.delete("/super-admins/admins/:id", protect, isSuperAdmin, deleteAdminBySuperUser); // Delete adminUser

// =========================================================
// 🔸 SuperUser-only routes for superUser accounts
// =========================================================
router.get("/super", protect, isSuperAdmin);
router.put("/super-admins/:id/role", protect, isSuperAdmin, updateAdminRole); // Change role between adminUser and superUser
router.put("/super-admins/:id", protect, isSuperAdmin, updateAdminDetails);   // Update own details
router.delete("/super-admins/:id", protect, isSuperAdmin, deleteAdminUser);   // Delete own account

// =========================================================
// 🔸 SuperUser creation logic (first or subsequent)
// =========================================================
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

// =========================================================
// ✅ Unified route for all admins (adminUser + superUser)
// =========================================================
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

router.get("/super-admins/:id", protect, isSuperAdmin, async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user || !["adminUser", "superUser"].includes(user.role)) {
    return res.status(404).json({ message: "Admin not found" });
  }
  res.status(200).json(user);
});

export default router;
