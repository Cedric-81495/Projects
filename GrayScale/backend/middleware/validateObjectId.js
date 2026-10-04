// backend/middleware/validateObjectId.js
// Use with router.param("id", validateObjectIdParam) so an invalid ID like "/api/orders/abc"
// returns a clean 404 instead of a Mongoose CastError (500).
const mongoose = require("mongoose");

const validateObjectIdParam = (req, res, next, value) => {
  if (!mongoose.Types.ObjectId.isValid(value) || String(value).length !== 24) {
    return res.status(404).json({ message: "Not found" });
  }
  return next();
};

module.exports = { validateObjectIdParam };
