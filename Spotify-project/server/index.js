// index.js (cleaned up with connectDB)

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import spotifyRoutes from './routes/spotify.js';
import connectDB from './config/db.js'; // ✅ Import connectDB function

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URI,
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', spotifyRoutes);

// ✅ Connect to MongoDB first, then start server
connectDB().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('❌ Failed to start server due to DB error:', err);
});
