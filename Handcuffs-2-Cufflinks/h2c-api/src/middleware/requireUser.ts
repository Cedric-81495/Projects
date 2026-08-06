import type { RequestHandler } from 'express';
import { USER_COOKIE_NAME, verifyUserToken, type UserClaims } from '../auth/userTokens.js';
import { UserModel } from '../models/User.js';
import { HttpError } from './errorHandler.js';

// Attach the authenticated member to the request.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserClaims & { id: string };
    }
  }
}

/**
 * Gate a route behind a valid member session. Also re-checks the DB on each
 * request so a suspended or deleted account loses access immediately, rather
 * than staying valid until the JWT expires.
 */
export const requireUser: RequestHandler = async (req, _res, next) => {
  const token = req.cookies?.[USER_COOKIE_NAME];
  if (!token) return next(new HttpError(401, 'Please sign in to continue.'));

  let claims: UserClaims;
  try {
    claims = verifyUserToken(token);
  } catch {
    return next(new HttpError(401, 'Session expired. Please sign in again.'));
  }

  try {
    const user = await UserModel.findById(claims.sub).select('status role email').lean();
    if (!user) return next(new HttpError(401, 'Account not found. Please sign in again.'));
    if (user.status === 'suspended') {
      return next(new HttpError(403, 'This account has been suspended.'));
    }
    // Trust the DB role/email over the (possibly stale) token.
    req.user = { sub: claims.sub, id: claims.sub, email: user.email, role: user.role as 'user' | 'admin' };
    next();
  } catch (err) {
    next(err);
  }
};
