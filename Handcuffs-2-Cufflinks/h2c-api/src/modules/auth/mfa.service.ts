import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { ApiError } from '@/lib/ApiError';
import { logger } from '@/lib/logger';
import { mfaEnabledMail, sendMail } from '@/lib/mailer';
import { hashToken } from '@/lib/tokens';
import {
  generateCode,
  generateRecoveryCodes,
  generateSecret,
  hashRecoveryCode,
  otpauthUri,
  verifyCode,
} from '@/lib/totp';
import { User } from '@/models/User';

/**
 * Two-step verification for CMS accounts.
 *
 * The guide recommends MFA for administrators. It is offered to every staff
 * account and can be made compulsory for super administrators with
 * REQUIRE_SUPER_ADMIN_MFA, which is off by default — switching it on before the
 * team has authenticator apps installed locks everyone out at once, so it is a
 * deliberate act rather than a default.
 *
 * Enrolment is two steps on purpose. `begin` writes a secret but leaves
 * mfaEnabled false; `enable` flips it only after the user has proved they can
 * generate a current code. Enabling on the strength of "we showed them a QR
 * code" locks out anyone whose scan silently failed.
 */

const MFA_AUDIENCE = 'h2c-mfa';
/** Long enough to fetch a code from a phone, short enough to be useless later. */
const MFA_TICKET_TTL_SECONDS = 5 * 60;

/** Failed second-factor attempts before the account is locked. */
const MAX_MFA_ATTEMPTS = 5;
const MFA_LOCK_MINUTES = 15;

export interface MfaTicket {
  sub: string;
  /** Marks the half-authenticated state. A ticket is not a session. */
  stage: 'mfa';
  /** Ticket id, hashed onto the user record so the ticket can be spent. */
  jti: string;
}

/**
 * Issued after a correct password when MFA is on.
 *
 * Its own audience, so it cannot be presented as an access token: possession of
 * a ticket means "this password was correct", which is precisely the thing MFA
 * exists to stop being sufficient.
 *
 * Single-use, and only the most recent one is live. The signed JWT alone would
 * be replayable for its whole five minutes, so its id is hashed onto the user
 * record and cleared when spent — the same store-the-hash arrangement as
 * refresh tokens, for the same reason.
 */
export async function issueMfaTicket(userId: string): Promise<string> {
  const jti = crypto.randomBytes(16).toString('base64url');

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        mfaTicketHash: hashToken(jti),
        mfaTicketExpires: new Date(Date.now() + MFA_TICKET_TTL_SECONDS * 1000),
      },
    }
  );

  return jwt.sign({ sub: userId, stage: 'mfa', jti } satisfies MfaTicket, env.JWT_ACCESS_SECRET, {
    expiresIn: MFA_TICKET_TTL_SECONDS,
    issuer: 'h2c-api',
    audience: MFA_AUDIENCE,
  });
}

export function verifyMfaTicket(token: string): MfaTicket {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: 'h2c-api',
      audience: MFA_AUDIENCE,
    }) as MfaTicket;
  } catch {
    throw ApiError.unauthorized('That verification step timed out. Sign in again.');
  }
}

/**
 * Enforces the enrolment requirement, whichever first factor was used.
 *
 * Shared by the password path and the Google callback. Google proves an email
 * address; it does not prove possession of an authenticator, so an account the
 * policy says must have one is refused either way. Keeping this in one function
 * is what stops the two paths from drifting apart again.
 */
export function assertEnrolmentPolicy(user: { role: string; mfaEnabled: boolean }): void {
  if (env.REQUIRE_SUPER_ADMIN_MFA && user.role === 'super-admin' && !user.mfaEnabled) {
    throw ApiError.forbidden(
      'This account needs two-step verification set up before it can sign in. Ask another super administrator to help you enrol.'
    );
  }
}

/* ------------------------------------------------------------------ */
/* Enrolment                                                           */
/* ------------------------------------------------------------------ */

/**
 * Step one: generate and store a secret, return the QR payload.
 *
 * Regenerating on each call is intentional. Someone who abandoned enrolment
 * halfway and starts again should get a clean secret rather than one that may
 * already sit half-scanned in an app they since deleted. Refused outright once
 * MFA is on, so this cannot be used to quietly swap the secret out from under a
 * hijacked session.
 */
export async function beginEnrolment(userId: string) {
  const user = await User.findById(userId).select('email mfaEnabled');
  if (!user) throw ApiError.unauthorized();
  if (user.mfaEnabled) {
    throw ApiError.conflict('Two-step verification is already on. Turn it off first to re-enrol.');
  }

  const secret = generateSecret();
  await User.updateOne({ _id: userId }, { $set: { mfaSecret: secret } });

  return {
    secret,
    otpauthUri: otpauthUri(secret, user.email),
    // Lets the CMS show what a valid code looks like right now, which turns
    // "my code is rejected" into an obvious clock-drift diagnosis instead of a
    // support ticket.
    currentCodePreview: generateCode(secret),
  };
}

/**
 * Step two: confirm a code and switch it on.
 *
 * Recovery codes are returned exactly once, here. They are stored only as
 * hashes, so there is no route that can show them again — which is the point,
 * and is stated plainly in the response message so nobody closes the dialog
 * expecting to come back to it.
 */
export async function enable(userId: string, code: string) {
  const user = await User.findById(userId).select('+mfaSecret email fullName mfaEnabled');
  if (!user) throw ApiError.unauthorized();
  if (user.mfaEnabled) throw ApiError.conflict('Two-step verification is already on.');
  if (!user.mfaSecret) throw ApiError.badRequest('Start the setup again — no code has been issued.');

  if (!verifyCode(user.mfaSecret, code)) {
    throw ApiError.badRequest('That code did not match. Check your app and try the current code.');
  }

  const recoveryCodes = generateRecoveryCodes();
  user.mfaEnabled = true;
  user.mfaEnrolledAt = new Date();
  user.mfaRecoveryCodes = recoveryCodes.map(hashRecoveryCode);
  await user.save();

  await sendMail(mfaEnabledMail(user.email, user.fullName));

  return { recoveryCodes };
}

/**
 * Turns MFA off. Requires a current code, not just a signed-in session.
 *
 * A stolen session should not be able to remove the control that would have
 * stopped it. The caller also re-enters their password at the route layer, so
 * both factors are proven before the second one is given up.
 */
export async function disable(userId: string, code: string) {
  const user = await User.findById(userId).select('+mfaSecret +mfaRecoveryCodes mfaEnabled');
  if (!user) throw ApiError.unauthorized();
  if (!user.mfaEnabled) throw ApiError.badRequest('Two-step verification is not on.');

  if (!(await consumeFactor(user, code))) {
    throw ApiError.badRequest('That code did not match.');
  }

  user.mfaEnabled = false;
  user.mfaSecret = undefined;
  user.mfaEnrolledAt = null;
  user.mfaRecoveryCodes = [];
  await user.save();

  return { disabled: true };
}

/**
 * Issues a fresh set of recovery codes, invalidating the old ones.
 *
 * The natural thing to do after spending one, or after leaving the printout
 * somewhere it should not have been.
 */
export async function regenerateRecoveryCodes(userId: string) {
  const user = await User.findById(userId).select('+mfaSecret mfaEnabled');
  if (!user?.mfaEnabled) throw ApiError.badRequest('Two-step verification is not on.');

  const recoveryCodes = generateRecoveryCodes();
  await User.updateOne(
    { _id: userId },
    { $set: { mfaRecoveryCodes: recoveryCodes.map(hashRecoveryCode) } }
  );

  return { recoveryCodes };
}

/* ------------------------------------------------------------------ */
/* Challenge                                                           */
/* ------------------------------------------------------------------ */

interface MfaUser {
  mfaSecret?: string;
  mfaRecoveryCodes?: string[];
  save(): Promise<unknown>;
}

/**
 * Accepts either a TOTP code or an unused recovery code.
 *
 * A recovery code is spent on use — removed from the stored list rather than
 * marked — so the same slip of paper cannot be used twice, and so the remaining
 * count in the CMS is simply the array length.
 */
async function consumeFactor(user: MfaUser, submitted: string): Promise<boolean> {
  const value = submitted.trim();

  if (user.mfaSecret && verifyCode(user.mfaSecret, value)) return true;

  const hash = hashRecoveryCode(value);
  const codes = user.mfaRecoveryCodes ?? [];
  const index = codes.indexOf(hash);
  if (index === -1) return false;

  codes.splice(index, 1);
  user.mfaRecoveryCodes = codes;
  await user.save();
  return true;
}

/**
 * Second step of sign-in. Returns the user id once the factor checks out.
 *
 * The caller mints the session, so this function has no way to hand one out on
 * its own and cannot be wired into a path that skips the password.
 */
export async function completeChallenge(ticketToken: string, code: string): Promise<string> {
  const ticket = verifyMfaTicket(ticketToken);

  const user = await User.findById(ticket.sub).select(
    '+mfaSecret +mfaRecoveryCodes +mfaTicketHash +mfaTicketExpires email mfaEnabled isActive role'
  );
  if (!user?.isActive || !user.mfaEnabled) throw ApiError.unauthorized();

  /**
   * Lockout applies to this step too.
   *
   * The password path already locks after repeated failures, but the challenge
   * is the step that matters most: whoever is here has the password, which is
   * the exact scenario MFA exists for. Without a per-account counter the only
   * brake is the IP-keyed limiter, and an attacker with a proxy pool has no
   * brake at all.
   */
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw ApiError.tooMany('Too many incorrect codes. Try again in a few minutes.');
  }

  /**
   * The ticket must be the live one, and it is spent on use. A replayed ticket
   * finds no matching hash and is refused even inside its five-minute window.
   */
  const presented = hashToken(ticket.jti ?? '');
  const ticketValid =
    Boolean(user.mfaTicketHash) &&
    user.mfaTicketHash === presented &&
    Boolean(user.mfaTicketExpires) &&
    user.mfaTicketExpires! > new Date();

  if (!ticketValid) {
    throw ApiError.unauthorized('That verification step has already been used. Sign in again.');
  }

  if (!(await consumeFactor(user, code))) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_MFA_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + MFA_LOCK_MINUTES * 60_000);
      user.failedLoginAttempts = 0;
      // Cleared as well as locked: the attacker must go back through the
      // password step, which is itself rate limited and account locked.
      user.mfaTicketHash = undefined;
      user.mfaTicketExpires = null;
      logger.warn({ email: user.email }, 'account locked after repeated failed second-factor attempts');
    }
    await user.save();
    throw ApiError.unauthorized('That code did not match. Try the current one from your app.');
  }

  user.failedLoginAttempts = 0;
  user.lockedUntil = null;
  user.mfaTicketHash = undefined;
  user.mfaTicketExpires = null;
  await user.save();

  return String(user._id);
}

/** How many recovery codes are left, for the security screen in the CMS. */
export async function status(userId: string) {
  const user = await User.findById(userId).select('+mfaRecoveryCodes mfaEnabled mfaEnrolledAt role');
  if (!user) throw ApiError.unauthorized();

  return {
    enabled: user.mfaEnabled,
    enrolledAt: user.mfaEnrolledAt ?? null,
    recoveryCodesRemaining: user.mfaRecoveryCodes?.length ?? 0,
    /** True when policy requires this account to enrol before signing in. */
    required: env.REQUIRE_SUPER_ADMIN_MFA && user.role === 'super-admin',
  };
}
