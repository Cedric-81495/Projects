import express from "express";
import  { getBook, createBook, updateBook, deleteBook, getBookById } from "../controllers/bookController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(getBook)         
  .post(protect, admin, createBook);

router.route("/:id")
  .get(getBookById)
  .put(protect, admin, updateBook)
  .delete(protect, admin, deleteBook);

export default router;
