// backend/controllers/bookController.js
import asyncHandler from "express-async-handler";
import Book from "../models/Book.js";

// @desc    Get all books
// @route   GET /api/books
// @access  Public
export const getBooks = asyncHandler(async (req, res) => {
  const books = await Book.find();

  res.status(200).json(
    books.map((book) => ({
      id: book.id,
      type: book.type,
      attributes: book.attributes,
      relationships: book.relationships,
      links: book.links,
    }))
  );
});

// @desc    Get single book by ID
// @route   GET /api/books/:id
// @access  Public
export const getBookById = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404);
    throw new Error("Book not found");
  }

  res.status(200).json({
    id: book.id,
    type: book.type,
    attributes: book.attributes,
    relationships: book.relationships,
    links: book.links,
  });
});

// @desc    Create new book
// @route   POST /api/books
// @access  Private/Admin
export const createBook = asyncHandler(async (req, res) => {
  const { attributes, relationships } = req.body;

  const book = new Book({
    type: "book",
    attributes,
    relationships,
  });

  const createdBook = await book.save();
  createdBook.links = { self: `/v1/books/${createdBook._id}` };
  await createdBook.save();

  res.status(201).json(createdBook);
});

// @desc    Update existing book
// @route   PUT /api/books/:id
// @access  Private/Admin
export const updateBook = asyncHandler(async (req, res) => {
  const { attributes, relationships } = req.body;
  const book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404);
    throw new Error("Book not found");
  }

  book.attributes = attributes || book.attributes;
  book.relationships = relationships || book.relationships;
  await book.save();

  res.status(200).json(book);
});

// @desc    Delete a book
// @route   DELETE /api/books/:id
// @access  Private/Admin
export const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404);
    throw new Error("Book not found");
  }

  await book.deleteOne();
  res.status(200).json({ message: "Book deleted successfully" });
});
