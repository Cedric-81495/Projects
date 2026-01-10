// server.js
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Import Routes
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const orderRoutes = require("./routes/orderRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const subscribeRoute = require("./routes/subscribeRoute");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productAdminRoutes = require("./routes/productAdminRoutes");

const app = express();

// ---------- CORS Setup ----------
const allowedOrigins = [
  "https://mern-grayscale.onrender.com", // frontend prod
  "http://localhost:5173" // frontend dev
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests like Postman (no origin)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `CORS error: ${origin} is not allowed`;
      return callback(new Error(msg), false);
    }

    return callback(null, true);
  },
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// ---------- Connect to MongoDB ----------
connectDB();

// ---------- Test Route ----------
app.get("/", (req, res) => {
  res.send("Welcome to GrayScale API!");
});

// ---------- API Routes ----------
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api", subscribeRoute);

// ---------- Admin Routes ----------
app.use("/api/admin/users", adminRoutes);
app.use("/api/admin/products", productAdminRoutes);
app.use("/api/admin/orders", adminOrderRoutes);

// ---------- Start Server ----------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
