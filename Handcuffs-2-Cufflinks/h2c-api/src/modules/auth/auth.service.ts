import type { Request } from 'express';
import { ApiError } from '@/lib/ApiError';
import { logger } from '@/lib/logger';
import { fakeVerify, verifyPassword } from '@/lib/password';
import {
  REFRESH_TTL_DAYS,
  generateRefreshToken,
  hashToken,
  signAccessToken,
} from '@/lib/tokens';
import { RefreshToken } from '@/models/RefreshToken';
import { User } from '@/models/User';
import type { UserDoc } from '@/models/User';

const MAX_FAILED_ATTEMPTS = 8;
const LOCK_MINUTES = 15;

function expiryDate(): Date {
  return new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function publicUser(user: UserDoc) {
  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    mfaEnabled: user.mfaEnabled,
    avatarUrl: user.avatarUrl,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function issueSession(user: UserDoc, req: Request) {
  const { token, hash } = generateRefreshToken();
  await RefreshToken.create({
    userId: user._id,
    subjectType: 'user',
    tokenHash: hash,
    expiresAt: expiryDate(),
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });

  return {
    refreshToken: token,
    accessToken: signAccessToken({ sub: String(user._id), role: user.role, v: user.tokenVersion }),
    user: publicUser(user),
  };
}

/**
 * Password sign-in.
 *
 * Failures are deliberately indistinguishable: unknown email, wrong password,
 * and disabled account all produce the same message, and a missing user still
 * burns a bcrypt comparison so the response time does not reveal which case it
 * was. Otherwise the endpoint becomes a way to enumerate who has an account.
 */
export async function signIn(email: string, password: string, req: Request) {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+passwordHash fullName email role emailVerified mfaEnabled isActive avatarUrl lastLoginAt tokenVersion failedLoginAttempts lockedUntil createdAt updatedAt'
  );

  const generic = ApiError.unauthorized('That email and password combination did not work.');

  if (!user || !user.passwordHash) {
    await fakeVerify();
    throw generic;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw ApiError.tooMany('Too many failed attempts. Try again in a few minutes.');
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000);
      user.failedLoginAttempts = 0;
      logger.warn({ email: user.email }, 'account locked after repeated failed sign-ins');
    }
    await user.save();
    throw generic;
  }

  if (!user.isActive) throw generic;

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  return issueSession(user, req);
}

/**
 * Refresh with rotation and reuse detection.
 *
 * Each refresh token is single-use. If one that has already been rotated is
 * presented again, that means it was captured and replayed — so every session
 * for that user is revoked and their access tokens are invalidated. Losing a
 * session is a small cost against letting a stolen token keep working.
 */
export async function refresh(rawToken: string, req: Request) {
  // subjectType is part of the lookup: a member's refresh token must never
  // resolve here, or refreshing it would mint a CMS session.
  const stored = await RefreshToken.findOne({
    tokenHash: hashToken(rawToken),
    subjectType: 'user',
  });
  if (!stored) throw ApiError.unauthorized('Your session has expired. Sign in again.');

  if (stored.revokedAt) {
    logger.warn({ userId: String(stored.userId) }, 'refresh token reuse detected — revoking all sessions');
    await RefreshToken.updateMany(
      { userId: stored.userId, revokedAt: null },
      { revokedAt: new Date() }
    );
    await User.updateOne({ _id: stored.userId }, { $inc: { tokenVersion: 1 } });
    throw ApiError.unauthorized('Your session was ended for security reasons. Sign in again.');
  }

  if (stored.expiresAt < new Date()) {
    throw ApiError.unauthorized('Your session has expired. Sign in again.');
  }

  const user = await User.findById(stored.userId);
  if (!user || !user.isActive) throw ApiError.unauthorized('This account is no longer active.');

  const next = generateRefreshToken();
  stored.revokedAt = new Date();
  stored.replacedByHash = next.hash;
  await stored.save();

  await RefreshToken.create({
    userId: user._id,
    subjectType: 'user',
    tokenHash: next.hash,
    expiresAt: expiryDate(),
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });

  return {
    refreshToken: next.token,
    accessToken: signAccessToken({ sub: String(user._id), role: user.role, v: user.tokenVersion }),
    user: publicUser(user),
  };
}

export async function signOut(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;
  await RefreshToken.updateOne(
    { tokenHash: hashToken(rawToken), revokedAt: null },
    { revokedAt: new Date() }
  );
}

/** Used by Google OAuth, which has already proven the identity. */
export async function issueSessionForUser(user: UserDoc, req: Request) {
  user.lastLoginAt = new Date();
  await user.save();
  return issueSession(user, req);
}
