import crypto from 'node:crypto';
import { env } from '@/config/env';
import { ApiError } from '@/lib/ApiError';
import { logger } from '@/lib/logger';
import {
  passwordChangedMail,
  passwordResetMail,
  sendMail,
  verifyEmailMail,
} from '@/lib/mailer';
import { hashPassword } from '@/lib/password';
import { hashToken } from '@/lib/tokens';
import { RefreshToken } from '@/models/RefreshToken';
import { User } from '@/models/User';

/**
 * Password reset and email verification for staff accounts.
 *
 * Members already had these flows; the CMS did not, which meant an
 * administrator who forgot their password needed someone with database access
 * to fix it. That is not a workable operating model for a site run by VAs, and
 * it pushes teams toward shared logins.
 *
 * Three properties hold throughout:
 *
 *   Tokens are stored as SHA-256 hashes. The raw value exists only in the
 *   emailed link, so a database leak yields nothing usable — the same reasoning
 *   as refresh tokens.
 *
 *   Requesting a reset never reveals whether the address is registered. The
 *   response is identical either way, and the work done is comparable, because
 *   an endpoint that answers "no such user" faster is an account enumerator.
 *
 *   A completed reset revokes every session. If the reset happened because the
 *   account was compromised, leaving the attacker's session alive defeats it.
 */

const RESET_TTL_MINUTES = 60;
const VERIFY_TTL_HOURS = 24;

interface IssuedToken {
  raw: string;
  hash: string;
  expires: Date;
}

function issueToken(ttlMs: number): IssuedToken {
  const raw = crypto.randomBytes(32).toString('base64url');
  return { raw, hash: hashToken(raw), expires: new Date(Date.now() + ttlMs) };
}

/* ------------------------------------------------------------------ */
/* Password reset                                                      */
/* ------------------------------------------------------------------ */

/**
 * Starts a reset. Always resolves, regardless of whether the address exists.
 *
 * Accounts that sign in with Google and have never set a password are skipped:
 * sending them a reset link would create a password on an account whose owner
 * never chose to have one, which is a way in rather than a convenience.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+passwordHash fullName email isActive'
  );

  if (!user || !user.isActive || !user.passwordHash) {
    logger.debug({ email }, 'password reset requested for an address with no eligible account');
    return;
  }

  const token = issueToken(RESET_TTL_MINUTES * 60_000);
  user.passwordResetToken = token.hash;
  user.passwordResetExpires = token.expires;
  await user.save();

  const link = `${env.ADMIN_URL.replace(/\/$/, '')}/reset-password?token=${token.raw}`;
  await sendMail(passwordResetMail(user.email, user.fullName, link, RESET_TTL_MINUTES));
}

/**
 * Completes a reset.
 *
 * The lookup is by token hash with an unexpired window, so a used or stale
 * token behaves identically to a fabricated one. Both the reset fields and the
 * lockout counters are cleared: someone who reset their password because they
 * were locked out should not still be locked out afterwards.
 */
export async function completePasswordReset(rawToken: string, newPassword: string): Promise<void> {
  const user = await User.findOne({
    passwordResetToken: hashToken(rawToken),
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires fullName email isActive tokenVersion');

  if (!user || !user.isActive) {
    throw ApiError.badRequest('That reset link is no longer valid. Request a new one.');
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = null;
  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  // Invalidates every access token already issued for this account.
  user.tokenVersion += 1;
  await user.save();

  await RefreshToken.updateMany(
    { userId: user._id, subjectType: 'user', revokedAt: null },
    { revokedAt: new Date() }
  );

  // Sent after the change, not before: this is the message that tells the real
  // owner something happened, so it must reflect what actually did.
  await sendMail(passwordChangedMail(user.email, user.fullName));
}

/* ------------------------------------------------------------------ */
/* Email verification                                                  */
/* ------------------------------------------------------------------ */

export async function sendVerificationEmail(userId: string): Promise<void> {
  const user = await User.findById(userId).select('fullName email emailVerified');
  if (!user || user.emailVerified) return;

  const token = issueToken(VERIFY_TTL_HOURS * 60 * 60_000);
  user.verificationToken = token.hash;
  user.verificationExpires = token.expires;
  await user.save();

  const link = `${env.ADMIN_URL.replace(/\/$/, '')}/verify-email?token=${token.raw}`;
  await sendMail(verifyEmailMail(user.email, user.fullName, link));
}

export async function verifyEmail(rawToken: string): Promise<{ email: string }> {
  const user = await User.findOne({
    verificationToken: hashToken(rawToken),
    verificationExpires: { $gt: new Date() },
  }).select('+verificationToken +verificationExpires email emailVerified');

  if (!user) throw ApiError.badRequest('That confirmation link is no longer valid.');

  user.emailVerified = true;
  user.verificationToken = undefined;
  user.verificationExpires = null;
  await user.save();

  return { email: user.email };
}
