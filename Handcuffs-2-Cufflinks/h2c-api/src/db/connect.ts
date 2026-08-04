import dns from 'node:dns';
// Force a public DNS resolver so Atlas SRV (mongodb+srv://) lookups succeed
// even when the local/network resolver refuses SRV queries.
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';
import { env } from '../config/env.js';

mongoose.set('strictQuery', true);

export async function connectDB(): Promise<typeof mongoose> {
  const conn = await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
  });
  console.log(`🗄️  MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
