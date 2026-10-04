const jwt = require("jsonwebtoken");

// Single place that issues JWTs, so every login method gets the same payload and expiry.
// Set JWT_EXPIRES_IN in .env (e.g. "1d", "12h"); defaults to 1 day.
const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

const generateToken = (user) =>
  jwt.sign(
    {
      user: {
        id: user._id,
        role: user.role,
      },
    },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );

module.exports = generateToken;
