import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import characterRoutes from "./routes/characterRoutes.js";
import spellRoutes from "./routes/spellRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import registerRoutes from "./routes/registerRoutes.js";
import movieRoutes from "./routes/movieRoutes.js";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve();

// Middleware to parse JSON body to controllers
app.use(express.json());

// CORS configuration for development only
if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: "http://localhost:5173", // your frontend URL
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true, // if you use cookies or auth headers
    })
  );
}

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "✅ Backend connected successfully",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/characters", characterRoutes);
app.use("/api/spells", spellRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/register", registerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/users", adminRoutes); // Confirm if this is intended or should be a different route

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server started on PORT:", PORT);
  });
});
