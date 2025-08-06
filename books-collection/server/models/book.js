// server/models/book.js
const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  id: String,
  title: String,
  author: String,
  release_date: String,
  cover: String,
  summary: String,
  slug: String
  // Add any other fields synced from PotterDB
});

module.exports = mongoose.model('Book', BookSchema);
