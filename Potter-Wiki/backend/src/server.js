// backend/server.js
import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./src/routes/authRoutes.jss.js";
import characterRoutes from "./src/routes/characterRoutes.jss.js";
import spellRoutes from "./src/routes/spellRoutes.jss.js";
import studentRoutes from "./src/routes/studentRoutes.jss.js";
import staffRoutes from "./src/routes/staffRoutes.jss.js";
import bookRoutes from "./src/routes/bookRoutes.jss.js";
import adminRoutes from "./src/routes/adminRoutes.jss.js";
import publicRoutes from "./src/routes/publicRoutes.jss.js";
import registerRoutes from "./src/routes/registerRoutes.jss.js";
import movieRoutes from "./src/routes/movieRoutes.jss.js";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.resolve()

// middleware to parse JSON body to  controllers
app.use(express.json());

if (process.env.NODE_ENV !== "production"){
    app.use(
        cors({
            origin: "http://localhost:5173",
        }
    ));
}

// ✅ Parse incoming JSON
app.use(express.json());

// ✅ Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "✅ Backend connected successfully",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

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
app.use("/api/users", adminRoutes);

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get("*", (req, res) =>{
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });
}

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("Sever started on PORT:", PORT);
    });
});
