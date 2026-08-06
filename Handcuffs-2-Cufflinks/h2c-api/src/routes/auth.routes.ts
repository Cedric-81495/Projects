import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { requireUser } from '../middleware/requireUser.js';
import { HttpError } from '../middleware/errorHandler.js';
import { googleAuthSchema, profileUpdateSchema } from '../validation/schemas.js';
import { verifyGoogleIdToken } from '../auth/googleVerify.js';
import { signUserToken, setUserCookie, clearUserCookie } from '../auth/userTokens.js';
import { UserModel, toPublicUser } from '../models/User.js';

export const authRouter = Router();

// Throttle sign-in attempts per IP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Please wait and try again.' },
});

/**
 * POST /api/auth/google
 * Body: { credential } — the Google ID token from Google Identity Services.
 * Verifies it, creates or updates the member, and sets the session cookie.
 */
authRouter.post(
  '/google',
  authLimiter,
  validateBody(googleAuthSchema),
  asyncHandler(async (req, res) => {
    const profile = await verifyGoogleIdToken(req.body.credential);

    const user = await UserModel.findOneAndUpdate(
      { googleId: profile.googleId },
      {
        $set: {
          name: profile.name,
          avatar: profile.avatar,
          emailVerified: profile.emailVerified,
          lastLoginAt: new Date(),
        },
        $setOnInsert: {
          googleId: profile.googleId,
          email: profile.email,
          role: 'user',
          status: 'active',
          tier: 'member',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    if (user.status === 'suspended') {
      throw new HttpError(403, 'This account has been suspended.');
    }

    const token = signUserToken({
      sub: String(user._id),
      email: user.email,
      role: user.role as 'user' | 'admin',
    });
    setUserCookie(res, token);
    res.json({ user: toPublicUser(user) });
  }),
);

/** GET /api/auth/me — the current member, or 401 if not signed in. */
authRouter.get(
  '/me',
  requireUser,
  asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.user!.id).lean();
    if (!user) throw new HttpError(401, 'Account not found.');
    res.json({ user: toPublicUser(user) });
  }),
);

/** PATCH /api/auth/me — update the member's own editable profile fields. */
authRouter.patch(
  '/me',
  requireUser,
  validateBody(profileUpdateSchema),
  asyncHandler(async (req, res) => {
    const user = await UserModel.findByIdAndUpdate(req.user!.id, { $set: req.body }, { new: true }).lean();
    if (!user) throw new HttpError(404, 'Account not found.');
    res.json({ user: toPublicUser(user) });
  }),
);

/** POST /api/auth/logout — clear the member session cookie. */
authRouter.post('/logout', (_req, res) => {
  clearUserCookie(res);
  res.json({ ok: true });
});
