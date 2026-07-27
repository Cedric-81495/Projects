import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

console.log("CLIENT_URL =", process.env.CLIENT_URL);

import { connectDB } from './lib/db';
import authRoutes from './routes/auth.routes';
import contactRoutes from './routes/contact.routes';
import checkoutRoutes from './routes/checkout.routes';
import webhookRoutes from './routes/webhooks.routes';
import enrollmentsRoutes from './routes/enrollments.routes';
import programsRoutes from './routes/programs.routes';
import adminRoutes from './routes/admin.routes';
import documentsRouter from './routes/documents.routes';
import paymentsRouter from './routes/payments.routes';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true, // required so the browser sends/receives the httpOnly cookies
  })
);
app.use(cookieParser());

// Braintree webhooks are form-encoded (bt_signature + bt_payload), not raw
// signed JSON like Stripe's — so no express.raw() special case is needed
// here. express.urlencoded() below covers it. This route is optional:
// only needed for dispute/subscription notifications, not the core
// Drop-in + transaction.sale() checkout flow.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/webhooks', webhookRoutes);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/programs', programsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/documents', documentsRouter);
app.use('/api/payments', paymentsRouter);

const PORT = process.env.PORT ?? 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
