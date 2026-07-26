import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

// For routes that run AFTER requireAuth, key by user id so limits track the
// account rather than the IP (more accurate behind shared/office IPs, and
// still effective since an attacker needs a valid session either way).
// Falls back to IP for anything unauthenticated.
function keyByUserOrIp(req: Request) {
  return (req as any).user?.userId?.toString() ?? req.ip;
}

// Login: brute-force protection. Keep this generous enough that a real user
// mistyping their password a few times never gets blocked, but tight enough
// to make credential-stuffing impractical.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in a few minutes.' },
});

// Register: prevent mass/bot account creation from one IP.
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many accounts created from this network. Please try again later.' },
});

// Refresh: should be generous (legitimate clients call this often) but still
// capped so a leaked/stolen refresh token can't be hammered indefinitely.
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many refresh attempts. Please log in again.' },
});

// Checkout — client token: cheap Braintree call, but still worth capping
// so a script can't hammer it in a loop.
export const clientTokenLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByUserOrIp,
  message: { error: 'Too many requests. Please wait a moment and try again.' },
});

// Checkout — the actual charge: this is the important one. Caps repeated
// sale attempts (card testing, retry loops, accidental double-submits)
// per logged-in user.
export const checkoutLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByUserOrIp,
  message: { error: 'Too many payment attempts. Please wait a few minutes before trying again.' },
});

// Contact form: prevent spam submissions.
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages sent. Please try again later.' },
});
