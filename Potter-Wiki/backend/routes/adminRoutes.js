// backend/routes/adminRoutes.js
import express from "express";
import {
  getAdmins,
  registerAdmin,
  deleteAdminUser,
  createSuperAdmin,
  updateAdminRole,
  updateAdminDetails,
  getSuperAdmins,
} from "../controllers/adminController.js";

import { protect, admin, isSuperAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

if (process.env.ALLOW_ADMINUSER_CREATION === "true") {
  router.post("/register", protect, admin, registerAdmin);
}

if (process.env.ALLOW_SUPERUSER_CREATION === "true") {
  router.post("/super", protect, isSuperAdmin, createSuperAdmin); // Create super admin
  router.get("/super", getSuperAdmins); // Get super admins
}

router.get("/", protect, admin, getAdmins);
router.put("/:id/role", protect, isSuperAdmin, updateAdminRole); // Update admin role
router.put("/:id", protect, isSuperAdmin, updateAdminDetails);  // Update admin details
router.delete("/:id", protect, isSuperAdmin, deleteAdminUser); // Delete any admin or super admin (superUser-only)

export default router;