// backend/controllers/bookController.js
import asyncHandler from "express-async-handler";
import Book from "../models/Book.js";

// @desc Get all book members
// @route GET /api/book
// @access Public
const getBook = asyncHandler(async (req, res) => {
  const bookCollections = await Book.find({});
  res.status(200).json(bookCollections);
});

// @desc Create a new book member
// @route POST /api/book
// @access Private/Admin
const createBook = asyncHandler(async (req, res) => {
  const book = await Book.create(req.body);
  res.status(201).json(book);
});

// @desc Update a book member
// @route PUT /api/book/:id
// @access Private/Admin
const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.status(200).json(book);
});

// @desc Delete a book member
// @route DELETE /api/book/:id
// @access Private/Admin
const deleteBook = asyncHandler(async (req, res) => {
  await Book.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "Book deleted" });
});


export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json(book);
  } catch (error) {
    console.error("Error fetching book:", error);
    res.status(500).json({ message: "Server error" });
  }
};



export { getBook, createBook, updateBook, deleteBook };
