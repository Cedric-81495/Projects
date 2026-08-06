import type { RequestHandler } from 'express';
import { COOKIE_NAME, verifyAdminToken, type AdminClaims } from '../auth/tokens.js';
import { USER_COOKIE_NAME, verifyUserToken } from '../auth/userTokens.js';
import { UserModel } from '../models/User.js';
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

/**
 * Gate a route behind admin access. Two ways in:
 *   1. The env-based ROOT admin (cookie `h2c_admin`) — always works, no DB needed.
 *   2. A Google member (cookie `h2c_user`) whose DB role has been promoted to
 *      'admin' and whose account is active.
 * The root admin is the guaranteed recovery path if no DB admins exist.
 */
export const requireAdmin: RequestHandler = async (req, _res, next) => {
  // 1) Root admin cookie.
  const adminToken = req.cookies?.[COOKIE_NAME];
  if (adminToken) {
    try {
      req.admin = verifyAdminToken(adminToken);
      return next();
    } catch {
      /* fall through to user-admin check */
    }
  }

  // 2) Promoted member cookie.
  const userToken = req.cookies?.[USER_COOKIE_NAME];
  if (userToken) {
    try {
      const claims = verifyUserToken(userToken);
      const user = await UserModel.findById(claims.sub).select('email role status').lean();
      if (user && user.role === 'admin' && user.status === 'active') {
        req.admin = { sub: String(claims.sub), email: user.email, role: 'admin' };
        return next();
      }
    } catch {
      /* fall through to 401 */
    }
  }

  return next(new HttpError(401, 'Admin authentication required.'));
};
