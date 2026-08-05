import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

export function createApp() {
  const app = express();

  // Behind Render's proxy — needed for correct client IPs (rate limiting).
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  app.use(morgan(env.isProd ? 'combined' : 'dev'));

  // CORS: only the configured frontend origins may call the API from a browser.
  // credentials:true so the httpOnly admin auth cookie is sent/received.
  app.use(
    cors({
      credentials: true,
      origin(origin, cb) {
        // Allow same-origin/non-browser tools (no Origin header) and listed origins.
        if (!origin || env.corsOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`Origin not allowed by CORS: ${origin}`));
      },
    }),
  );

  // Health check (Render pings this).
  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  // Throttle writes to blunt spam/abuse on the public POST endpoints.
  const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests. Please try again shortly.' },
  });
  app.use('/api', (req, res, next) => {
    // Public writes are throttled; admin routes have their own auth + login limiter.
    if (req.method === 'POST' && !req.path.startsWith('/admin')) {
      return writeLimiter(req, res, next);
    }
    next();
  });

  app.use('/api', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
