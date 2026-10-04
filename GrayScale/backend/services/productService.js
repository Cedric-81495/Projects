// backend/services/productService.js
// Shared create/update logic for BOTH /api/products and /api/admin/products.
//
// Old code used `product.x = req.body.x || product.x`, which silently ignored
// 0 and false (couldn't unpublish, couldn't set stock to 0). Here a field is updated
// whenever it is PRESENT in the body (!== undefined), and Mongoose validation runs on save.

// Only these fields can be set from a request. `user`, `_id`, `rating`, `numReviews`,
// timestamps etc. can never be overwritten by the client.
const EDITABLE_FIELDS = [
  "name",
  "description",
  "price",
  "discountPrice",
  "countInStock",
  "sku",
  "category",
  "brand",
  "sizes",
  "colors",
  "collections",
  "material",
  "gender",
  "images",
  "isFeatured",
  "isPublished",
  "tags",
  "dimensions",
  "weight",
  "metaTitle",
  "metaDescription",
  "metaKeywords",
];

// Optional fields that may be cleared by sending "" or null
const CLEARABLE_FIELDS = ["discountPrice", "material", "weight", "metaTitle", "metaDescription", "metaKeywords"];

const BOOLEAN_FIELDS = ["isFeatured", "isPublished"];

const normalize = (field, value) => {
  if (CLEARABLE_FIELDS.includes(field) && (value === "" || value === null)) {
    return undefined; // unset
  }
  if (BOOLEAN_FIELDS.includes(field) && typeof value === "string") {
    return value === "true";
  }
  return value;
};

// Pick allowed fields that are present in the body
const pickProductFields = (body = {}) => {
  const data = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) data[field] = normalize(field, body[field]);
  }
  return data;
};

// Apply present fields to a Mongoose document (0 / false / [] are real values)
const applyProductUpdates = (product, body) => {
  const updates = pickProductFields(body);
  for (const [field, value] of Object.entries(updates)) {
    product.set(field, value);
  }
  return product;
};

// Map Mongoose/Mongo errors to a clean HTTP response
const sendProductError = (res, error, fallback = "Server Error") => {
  if (error.name === "ValidationError") {
    const message = Object.values(error.errors).map((e) => e.message).join(", ");
    return res.status(400).json({ message });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ message: `Invalid value for ${error.path}` });
  }
  if (error.code === 11000) {
    return res.status(400).json({ message: "SKU already exists" });
  }
  console.error(fallback, error);
  return res.status(500).json({ message: fallback });
};

module.exports = { pickProductFields, applyProductUpdates, sendProductError, EDITABLE_FIELDS };
