// One-time migration: publish products that were never explicitly published.
//
// Why: the storefront now only shows products with isPublished: true. Before this change
// the seed data never set isPublished (so every product defaulted to false), and admins
// had no way to unpublish (the old update code ignored `false`). So every existing
// `false` is an accidental default, not a deliberate choice — safe to flip once.
//
// Run ONCE from the backend folder:   npm run publish-existing
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const Product = require("../models/Product");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const hidden = await Product.countDocuments({ isPublished: { $ne: true } });
    const result = await Product.updateMany(
      { isPublished: { $ne: true } },
      { $set: { isPublished: true } }
    );
    console.log(`Found ${hidden} unpublished product(s); published ${result.modifiedCount}.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  }
})();
