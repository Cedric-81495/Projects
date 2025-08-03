// server/config/db.js
import dotenv from 'dotenv';
dotenv.config();
console.log('db.js script running');
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('DB_NAME:', process.env.DB_NAME);
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const dbName = process.env.DB_NAME || 'test'; // fallback if not set
    const mongoUri = `${process.env.MONGO_URI}/${dbName}`;

    console.log('📡 Attempting to connect to MongoDB with URI:', mongoUri);

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    console.log(`✅ MongoDB connected (${states[mongoose.connection.readyState]})`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
};

export default connectDB;
