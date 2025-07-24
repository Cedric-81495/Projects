// server/server.js

require('dotenv').config(); // ✅ Only call this ONCE at the top

const express = require('express');
const cors = require('cors');
const connectDB = require('./db/connect');
const bookRoutes = require('./routes/books');

const app = express();
app.use(cors());
app.use(express.json());

connectDB(); // 🔌 Connect to MongoDB

app.use('/api/books', bookRoutes); // 📚 API routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
