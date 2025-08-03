// server/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  spotifyId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  displayName: String,
  profileUrl: String,
  refreshToken: { type: String, required: true },
  tokenExpiry: Date,
  isDevUser: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
