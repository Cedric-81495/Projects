import type { RequestHandler } from 'express';
import { ApiError } from '@/lib/ApiError';
import { asyncHandler } from '@/lib/asyncHandler';
import { verifyAccessToken } from '@/lib/tokens';
import { User } from '@/models/User';
import { roleHas } from '@/types/auth';
import type { Permission } from '@/types/auth';

/**
 * Authentication.
 *
 * The token is verified cryptographically and then checked against the user
 * record, because a signed token alone cannot tell you the account has since
 * been disabled or had its role reduced. tokenVersion is the revocation lever:
 * bumping it invalidates every token already issued to that user.
 */
export const requireAuth: RequestHandler = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw ApiError.unauthorized();

  let payload;
  try {
    payload = verifyAccessToken(header.slice(7));
  } catch {
    throw ApiError.unauthorized('Your session has expired. Sign in again.');
  }

  const user = await User.findById(payload.sub).select('email role isActive tokenVersion');
  if (!user || !user.isActive) throw ApiError.unauthorized('This account is no longer active.');
  if (user.tokenVersion !== payload.v) {
    throw ApiError.unauthorized('Your session is no longer valid. Sign in again.');
  }

  req.actor = { id: String(user._id), email: user.email, role: user.role };
  next();
});

/**
 * Authorisation.
 *
 * This is the security boundary. The frontend hides routes a role cannot use,
 * but that is a courtesy — anything the browser decides can be bypassed, so
 * every protected route re-checks here.
 */
export function requirePermission(permission: Permission): RequestHandler {
  const guard: RequestHandler = (req, _res, next) => {
    if (!req.actor) return next(ApiError.unauthorized());
    if (!roleHas(req.actor.role, permission)) {
      return next(ApiError.forbidden('You do not have permission to do that.'));
    }
    next();
  };

  /**
   * The permission this guard enforces, readable from the route stack.
   *
   * The admin hides controls a role cannot use and the API refuses the request
   * regardless — the same rule declared twice, in two packages, with nothing
   * linking them. Express keeps no record of what a middleware checks, so
   * without this tag the contract check cannot compare the two and a drift
   * shows up as a permission error on a button that should not have been
   * offered. Inert at runtime.
   */
  Object.defineProperty(guard, 'h2cPermission', { value: permission, enumerable: false });
  return guard;
}
