import type { RequestHandler } from 'express';
import { ApiError } from '@/lib/ApiError';
import { asyncHandler } from '@/lib/asyncHandler';
import { verifyMemberToken } from '@/lib/tokens';
import { Member } from '@/models/Member';

/**
 * Member authentication.
 *
 * Deliberately separate from requireAuth. A member token carries a different
 * audience, so it fails verification on staff routes outright rather than
 * relying on a permission check further down. Members hold no permissions at
 * all, so there is no requireMemberPermission counterpart — if a route needs
 * one, it is a staff route.
 */
export const requireMember: RequestHandler = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw ApiError.unauthorized();

  let payload;
  try {
    payload = verifyMemberToken(header.slice(7));
  } catch {
    throw ApiError.unauthorized('Your session has expired. Sign in again.');
  }

  const member = await Member.findById(payload.sub).select('email isActive tokenVersion');
  if (!member?.isActive) throw ApiError.unauthorized('This account is no longer active.');
  if (member.tokenVersion !== payload.v) {
    throw ApiError.unauthorized('Your session is no longer valid. Sign in again.');
  }

  req.member = { id: String(member._id), email: member.email };
  next();
});

/**
 * Populates req.member when a valid token is present, but never rejects.
 *
 * Used on engagement routes so a signed-in member's reactions are attributed to
 * their account while anonymous visitors keep working exactly as before.
 * Registration must never become a wall in front of something that already
 * worked without it.
 */
export const optionalMember: RequestHandler = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next();

  try {
    const payload = verifyMemberToken(header.slice(7));
    const member = await Member.findById(payload.sub).select('email isActive tokenVersion');
    if (member?.isActive && member.tokenVersion === payload.v) {
      req.member = { id: String(member._id), email: member.email };
    }
  } catch {
    // An expired or invalid token simply means "treat them as anonymous".
  }
  next();
});
