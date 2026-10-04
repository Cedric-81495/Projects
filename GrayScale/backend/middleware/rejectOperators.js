// backend/middleware/rejectOperators.js
// Defense-in-depth against NoSQL injection and prototype pollution.
//
// A body like {"email": {"$regex": "^a"}} turns an equality check into a pattern search,
// which can be used to extract data one character at a time. The app never sends keys
// starting with "$" (or containing "."), so any request that does is rejected outright.
// Query strings are already safe: Express 5's default parser only produces strings/arrays.
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const MAX_DEPTH = 20;

const findBadKey = (value, depth = 0) => {
  if (depth > MAX_DEPTH) return "(too deeply nested)";
  if (Array.isArray(value)) {
    for (const item of value) {
      const bad = findBadKey(item, depth + 1);
      if (bad) return bad;
    }
    return null;
  }
  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      if (key.startsWith("$") || key.includes(".") || FORBIDDEN_KEYS.has(key)) return key;
      const bad = findBadKey(value[key], depth + 1);
      if (bad) return bad;
    }
  }
  return null;
};

const rejectOperators = (req, res, next) => {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    const bad = findBadKey(req.body);
    if (bad) return res.status(400).json({ message: "Invalid request" });
  }
  return next();
};

module.exports = { rejectOperators };
