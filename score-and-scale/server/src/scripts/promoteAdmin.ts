// Usage: npx ts-node src/scripts/promoteAdmin.ts you@email.com
import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../lib/db';
import { User } from '../models/User';
import mongoose from 'mongoose';

async function run() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npx ts-node src/scripts/promoteAdmin.ts sample-email@gmail.com');
    process.exit(1);
  }

  await connectDB();
  const user = await User.findOneAndUpdate({ email }, { role: 'admin' }, { new: true });
  if (!user) {
    console.error(`No user found with email ${email} — register the account first, then run this.`);
  } else {
    console.log(`${user.email} is now an admin.`);
  }
  await mongoose.disconnect();
}

run();
