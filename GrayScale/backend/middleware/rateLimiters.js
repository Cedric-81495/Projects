// backend/middleware/rateLimiters.js
// Brute-force protection for auth endpoints.
// NOTE: MemoryStore is per-process. That's fine for a single Render/VPS instance; if you
// scale to multiple instances, switch to a shared store (e.g. rate-limit-redis).
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const MINUTE = 60 * 1000;

const tooMany = (message) => (req, res) => res.status(429).json({ message });

// Login: 10 failed attempts per IP+email per 15 minutes.
// Keyed by email too, so one attacker can't lock out everyone behind the same IP (e.g. a
// school/office network), and one account can't be brute-forced from a single IP.
// Successful logins don't count.
const loginLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip)}:${String(req.body?.email || "").toLowerCase().trim()}`,
  handler: tooMany("Too many login attempts. Please try again in 15 minutes."),
});

// Login from one IP across ALL emails (stops credential stuffing): 50 per 15 minutes
const loginIpLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 50,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: tooMany("Too many login attempts from this network. Please try again later."),
});

// Registration: 5 new accounts per IP per hour
const registerLimiter = rateLimit({
  windowMs: 60 * MINUTE,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipFailedRequests: true, // typos / "user exists" don't use up the quota
  handler: tooMany("Too many accounts created from this network. Please try again later."),
});

// Google sign-in: 20 per IP per 15 minutes
const googleLimiter = rateLimit({
  windowMs: 15 * MINUTE,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: tooMany("Too many sign-in attempts. Please try again later."),
});

module.exports = { loginLimiter, loginIpLimiter, registerLimiter, googleLimiter };
