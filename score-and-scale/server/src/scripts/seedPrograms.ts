import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../lib/db';
import { Program } from '../models/Program';
import mongoose from 'mongoose';

const PROGRAMS = [
  { slug: 'academy', name: 'Score & Scale Academy', priceCents: 49700, billingType: 'one_time' as const },
  { slug: 'repair-build', name: 'Repair + Build Program', priceCents: 180000, billingType: 'program' as const },
  { slug: 'mentorship', name: 'Private Funding Mentorship', priceCents: 500000, billingType: 'engagement' as const },
];

async function seed() {
  await connectDB();
  for (const p of PROGRAMS) {
    await Program.findOneAndUpdate({ slug: p.slug }, p, { upsert: true, new: true });
    console.log(`Upserted program: ${p.slug}`);
  }
  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
