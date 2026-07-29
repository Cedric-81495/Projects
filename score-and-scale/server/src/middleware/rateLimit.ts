import rateLimit, { type Options } from 'express-rate-limit'
import { env } from '../lib/env'

/**
 * Render terminates TLS at a reverse proxy, so req.ip is only meaningful with
 * `trust proxy` enabled in index.ts. Without it every request appears to come
 * from the same address and one visitor could exhaust everybody's quota.
 */
function build(windowMs: number, max: number, code: string, message: string) {
  const options: Partial<Options> = {
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    // Bypass limits locally so development is not throttled while iterating.
    skip: () => !env.isProduction && process.env.RATE_LIMIT_IN_DEV !== 'true',
    handler: (_req, res) => {
      res.status(429).json({ code, message })
    },
  }
  return rateLimit(options)
}

/** Brute-force protection for credential endpoints. */
export const authLimiter = build(
  15 * 60 * 1000,
  10,
  'RATE_LIMITED',
  'Too many attempts. Please wait a few minutes and try again.',
)

/** Contact form — spam control. */
export const contactLimiter = build(
  60 * 60 * 1000,
  5,
  'RATE_LIMITED',
  'You have sent several messages already. Please try again later.',
)

/** Payment endpoints: expensive downstream, so kept tight. */
export const checkoutLimiter = build(
  15 * 60 * 1000,
  20,
  'RATE_LIMITED',
  'Too many checkout attempts. Please wait a few minutes and try again.',
)

/** Signed-URL issuance, to stop a token being farmed in bulk. */
export const uploadLimiter = build(
  15 * 60 * 1000,
  30,
  'RATE_LIMITED',
  'Too many uploads. Please wait a few minutes and try again.',
)

/** Broad backstop applied to the whole /api surface. */
export const globalLimiter = build(
  60 * 1000,
  120,
  'RATE_LIMITED',
  'Too many requests. Please slow down.',
)
