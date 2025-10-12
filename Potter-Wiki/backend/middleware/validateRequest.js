import { body } from "express-validator";
import { validateRequest } from "../middleware/validateRequest.js"; // custom middleware to handle validation errors

router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validateRequest,
  registerUser
);