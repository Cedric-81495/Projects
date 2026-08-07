import { Router } from 'express';
import { ApiError } from '@/lib/ApiError';
import { asyncHandler } from '@/lib/asyncHandler';
import { ok } from '@/lib/envelope';
import { REFRESH_COOKIE, refreshCookieOptions } from '@/lib/tokens';
import { audit } from '@/middleware/audit';
import { requireAuth } from '@/middleware/auth';
import { authLimiter } from '@/middleware/rateLimit';
import { validateBody } from '@/middleware/validate';
import { User } from '@/models/User';
import { hashPassword, verifyPassword } from '@/lib/password';
import { changePasswordSchema, signInSchema } from './auth.schemas';
import * as service from './auth.service';

export const authRouter = Router();

authRouter.post(
  '/sign-in',
  authLimiter,
  validateBody(signInSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };

    try {
      const session = await service.signIn(email, password, req);
      res.cookie(REFRESH_COOKIE, session.refreshToken, refreshCookieOptions());
      audit(req, 'auth.sign-in', 'user', { resourceId: session.user.id, actorEmail: session.user.email });
      // The refresh token goes in the cookie only — never the response body.
      ok(res, { user: session.user, accessToken: session.accessToken });
    } catch (error) {
      audit(req, 'auth.sign-in', 'user', { outcome: 'failure', actorEmail: email, meta: { email } });
      throw error;
    }
  })
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) throw ApiError.unauthorized('No active session.');

    const session = await service.refresh(token, req);
    res.cookie(REFRESH_COOKIE, session.refreshToken, refreshCookieOptions());
    ok(res, { user: session.user, accessToken: session.accessToken });
  })
);

authRouter.post(
  '/sign-out',
  asyncHandler(async (req, res) => {
    await service.signOut(req.cookies?.[REFRESH_COOKIE] as string | undefined);
    res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
    ok(res, { signedOut: true });
  })
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.actor!.id);
    if (!user) throw ApiError.unauthorized();
    ok(res, service.publicUser(user));
  })
);

authRouter.post(
  '/password/change',
  requireAuth,
  authLimiter,
  validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    const user = await User.findById(req.actor!.id).select('+passwordHash');
    if (!user?.passwordHash) throw ApiError.badRequest('This account has no password set.');

    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      audit(req, 'auth.password-change', 'user', { outcome: 'failure', resourceId: req.actor!.id });
      throw ApiError.badRequest('Your current password is not correct.');
    }

    user.passwordHash = await hashPassword(newPassword);
    // Signs out every other session — the expected behaviour after a password
    // change, and the point of it if the account was compromised.
    user.tokenVersion += 1;
    await user.save();

    audit(req, 'auth.password-change', 'user', { resourceId: req.actor!.id });
    ok(res, { changed: true }, 'Password updated. Other sessions have been signed out.');
  })
);
