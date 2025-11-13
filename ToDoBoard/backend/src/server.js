// backend/src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import notesRoutes from "./routes/notesRoutes.js";
import { connectDB } from "./config/db.js"; 
import rateLimiter from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// middleware to parse JSON body to  controllers
app.use(express.json());
app.use(
    cors({
        origin: "http://localhost:5173",
    }
      
));
app.use(express.json());
app.use(rateLimiter);


app.use("/api/notes", notesRoutes);

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("Sever started on PORT:", PORT);
    });
});



