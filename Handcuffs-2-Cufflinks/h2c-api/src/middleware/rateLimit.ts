import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import { ApiError } from '@/lib/ApiError';

const handler = (): never => {
  throw ApiError.tooMany();
};

/** Baseline for the whole API. */
export const generalLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
});

/**
 * Sign-in and password reset. Tight, and keyed on email as well as IP so a
 * distributed attempt against one account is still throttled.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : '';
    return `${req.ip}:${email}`;
  },
  handler,
});

/** Public writes: story submissions, nominations, subscribe. */
export const submissionLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
});

/** Engagement is high-frequency by nature but still needs a ceiling. */
export const engagementLimiter = rateLimit({
  windowMs: 60_000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
});
