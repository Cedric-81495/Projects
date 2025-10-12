// File: backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import characterRoutes from "./routes/characterRoutes.js";
import spellRoutes from "./routes/spellRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";

dotenv.config();
connectDB();

const app = express();

// ✅ Proper CORS configuration
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173", // allow local dev
      "https://potter-wiki-pedia.vercel.app",                   // your Vercel domain
    ],
    credentials: true,
  })
);

app.use(express.json());

// ✅ Optional: simple test route for Render health check
app.get("/", (req, res) => {
  res.send("✅ Potter Wiki Backend is running...");
});

// ✅ Your API routes
app.use("/api/auth", authRoutes);
app.use("/api/characters", characterRoutes);
app.use("/api/spells", spellRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/register", publicRoutes); // you only need this once!


// ✅ Start server local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
