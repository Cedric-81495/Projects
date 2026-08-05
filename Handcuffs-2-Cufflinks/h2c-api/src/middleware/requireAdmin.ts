import type { RequestHandler } from 'express';
import { COOKIE_NAME, verifyAdminToken, type AdminClaims } from '../auth/tokens.js';
import { HttpError } from './errorHandler.js';

// Attach the authenticated admin to the request.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminClaims;
    }
  }
}

/** Gate a route behind a valid admin auth cookie. */
export const requireAdmin: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return next(new HttpError(401, 'Authentication required.'));
  try {
    req.admin = verifyAdminToken(token);
    next();
  } catch {
    next(new HttpError(401, 'Session expired or invalid. Please sign in again.'));
  }
};
