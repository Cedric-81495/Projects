import express from "express";
import {
  createSuperAdmin,
  createAdminBySuperUser,
  updateAdminBySuperUser,
  deleteAdminBySuperUser,
  updateAdminRole,
  updateAdminDetails,
  deleteAdminUser,
  getAllAdmins,
  getAdminById,
  getSuperAdmins,
} from "../controllers/superAdminController.js";

import { protect, admin, isSuperAdmin } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// 🔸 SuperUser-only CRUD for adminUser accounts
router.post("/super-admins/admins", protect, isSuperAdmin, createAdminBySuperUser);
router.put("/super-admins/admins/:id", protect, isSuperAdmin, updateAdminBySuperUser);
router.delete("/super-admins/admins/:id", protect, isSuperAdmin, deleteAdminBySuperUser);

// 🔸 SuperUser-only routes for superUser accounts
router.get("/super", protect, isSuperAdmin, getSuperAdmins);
router.put("/super-admins/:id/role", protect, isSuperAdmin, updateAdminRole);
router.put("/super-admins/:id", protect, isSuperAdmin, updateAdminDetails);
router.delete("/super-admins/:id", protect, isSuperAdmin, deleteAdminUser);
router.get("/super-admins/:id", protect, isSuperAdmin, getAdminById);

// 🔸 SuperUser creation logic (first or subsequent)
router.post("/super", async (req, res, next) => {
  try {
    const superUserCount = await User.countDocuments({ role: "superUser" });

    if (superUserCount > 0) {
      return protect(req, res, () =>
        isSuperAdmin(req, res, () => createSuperAdmin(req, res, next))
      );
    }

    return createSuperAdmin(req, res, next);
  } catch (err) {
    console.error("Error checking superUser count:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// 🔸 Unified route for all admins
router.get("/all", protect, admin, getAllAdmins);

export default router;