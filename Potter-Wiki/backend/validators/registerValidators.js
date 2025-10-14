// backend/validators/registerValidators.js
import { body } from "express-validator";

export const registerValidationRules = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];