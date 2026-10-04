// server.js
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

// API Routes
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const orderRoutes = require("./routes/orderRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const subscribeRoute = require("./routes/subscribeRoute");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const { rejectOperators } = require("./middleware/rejectOperators");
const { securityHeaders } = require("./middleware/securityHeaders");
const { router: paymentRoutes, webhookHandler: paymongoWebhook } = require("./routes/paymentRoutes");

// Admin Routes
const adminRoutes = require("./routes/adminRoutes");
const productAdminRoutes = require("./routes/productAdminRoutes");

// ---------- Startup safety checks ----------
// A short or guessable JWT_SECRET lets anyone forge login tokens (including admin ones).
const jwtSecret = process.env.JWT_SECRET || "";
if (jwtSecret.length < 32) {
  const msg = "JWT_SECRET must be at least 32 random characters. Generate one with:\n" +
    "  node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"";
  if (process.env.NODE_ENV === "production") {
    console.error(`✖ Refusing to start: ${msg}`);
    process.exit(1);
  }
  console.warn(`⚠️  ${msg}`);
}

const app = express();

// Security headers first, so every response (API, SPA, errors) gets them
app.use(securityHeaders);
app.disable("x-powered-by");

// ---------- Middleware ----------
// PayMongo webhook needs the RAW body for signature verification,
// so it must be registered BEFORE express.json()
app.post(
  "/api/payments/paymongo/webhook",
  express.raw({ type: "application/json" }),
  paymongoWebhook
);

app.use(express.json({ limit: "100kb" }));
// Block NoSQL-operator / prototype-pollution keys in every JSON body (see middleware)
app.use(rejectOperators);

// ---------- Proxy ----------
// On Render/Heroku/Vercel the app sits behind a proxy. Without this, req.ip is the proxy's
// IP, so the rate limiter would treat ALL visitors as one person. Set TRUST_PROXY=0 if the
// server is exposed directly (e.g. plain local dev), otherwise 1 = trust one proxy hop.
app.set("trust proxy", Number(process.env.TRUST_PROXY ?? (process.env.NODE_ENV === "production" ? 1 : 0)));

// ---------- CORS Setup ----------
// Comma-separated list in .env, e.g.
//   CORS_ORIGINS=https://mern-grayscale.onrender.com,https://www.grayscale.ph
// Falls back to FRONTEND_URL, and always allows the Vite dev server outside production.
const allowedOrigins = [
  ...String(process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
  ...(process.env.NODE_ENV === "production" ? [] : ["http://localhost:5173"]),
];

if (allowedOrigins.length === 0) {
  console.warn("⚠️  No CORS_ORIGINS set — browser requests from other origins will be blocked");
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow same-origin / server-to-server requests (no Origin header), e.g. Postman, webhooks
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS error: ${origin} is not allowed`), false);
    },
    credentials: true,
  })
);

// ---------- API Routes ----------
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api", subscribeRoute);
app.use("/api/payments", paymentRoutes);

// Admin Routes
app.use("/api/admin/users", adminRoutes);
app.use("/api/admin/products", productAdminRoutes);
app.use("/api/admin/orders", adminOrderRoutes);

// Unknown API routes -> JSON 404 (instead of falling through to the React app)
app.use("/api", (req, res) => {
  res.status(404).json({ message: `Not found: ${req.method} ${req.originalUrl}` });
});

// ---------- Serve Frontend ----------
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(distPath));

  // React Router fallback. Express 5 needs a real RegExp (or "/{*splat}");
  // the old string "/.*/" never matched anything.
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // Dev route
  app.get("/", (req, res) => {
    res.send("Welcome to GrayScale API!");
  });
}

// ---------- Global error handler ----------
// Catches anything a route didn't handle (bad JSON bodies, CastErrors, etc.)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request is too large" });
  }
  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid ID" });
  }
  if (err.message?.startsWith("CORS error")) {
    return res.status(403).json({ message: err.message });
  }
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ message: "Server error" });
});

// ---------- Start Server ----------
// Connect to MongoDB FIRST so no request hits the DB before it's ready
// (db.js uses bufferCommands: false, so early queries would throw).
const PORT = process.env.PORT || 5000;

// Warn loudly if the storefront would be empty (only published products are shown)
const checkStoreHasProducts = async () => {
  try {
    const Product = require("./models/Product");
    const total = await Product.estimatedDocumentCount();
    if (total === 0) {
      console.warn("⚠️  No products in the database — the store will be empty.");
      console.warn("   Add products in the admin panel, or seed a TEST database: npm run seed");
      return;
    }
    const published = await Product.countDocuments({ isPublished: true });
    if (published === 0) {
      console.warn(`⚠️  ${total} product(s) found but NONE are published, so the store looks empty.`);
      console.warn("   Products saved before publishing existed default to hidden. Fix once with:");
      console.warn("     npm run publish-existing      (from the backend folder)");
    }
  } catch (error) {
    console.warn("Could not check products:", error.message);
  }
};

connectDB()
  .then(() => {
    checkStoreHasProducts();
    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT} (mode: ${process.env.NODE_ENV || "development"})`
      );
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  });

module.exports = app;
