import type { Request } from 'express';
import { ApiError } from '@/lib/ApiError';
import { logger } from '@/lib/logger';
import { fakeVerify, hashPassword, verifyPassword } from '@/lib/password';
import {
  REFRESH_TTL_DAYS,
  generateRefreshToken,
  hashToken,
  signMemberToken,
} from '@/lib/tokens';
import { Engagement } from '@/models/engagement';
import { Member } from '@/models/Member';
import type { MemberDoc } from '@/models/Member';
import { RefreshToken } from '@/models/RefreshToken';
import { Subscriber } from '@/models/Subscriber';

const MAX_FAILED_ATTEMPTS = 8;
const LOCK_MINUTES = 15;

function expiryDate(): Date {
  return new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function publicMember(member: MemberDoc) {
  return {
    id: String(member._id),
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    location: member.location,
    emailVerified: member.emailVerified,
    subscribedToMovement: member.subscribedToMovement,
    createdAt: member.createdAt,
  };
}

/**
 * Carries anonymous engagement into the account.
 *
 * Someone who liked and voted before signing up would otherwise lose all of it
 * the moment they register — which is exactly the wrong reward for joining.
 * Rows already claimed by this member are skipped so nothing double-counts, and
 * the item totals are untouched because the underlying reactions are unchanged.
 */
async function claimAnonymousEngagement(memberId: string, visitorId?: string): Promise<number> {
  if (!visitorId) return 0;

  const anonymous = await Engagement.find({ visitorId, memberId: null }).select('itemId action');
  if (anonymous.length === 0) return 0;

  const alreadyMine = await Engagement.find({ memberId }).select('itemId action');
  const mine = new Set(alreadyMine.map((row) => `${String(row.itemId)}:${row.action}`));

  let claimed = 0;
  for (const row of anonymous) {
    if (mine.has(`${String(row.itemId)}:${row.action}`)) continue;
    await Engagement.updateOne({ _id: row._id }, { memberId });
    claimed += 1;
  }

  if (claimed > 0) logger.info({ memberId, claimed }, 'claimed anonymous engagement for member');
  return claimed;
}

async function issueSession(member: MemberDoc, req: Request) {
  const { token, hash } = generateRefreshToken();
  await RefreshToken.create({
    userId: member._id,
    subjectType: 'member',
    tokenHash: hash,
    expiresAt: expiryDate(),
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });

  await claimAnonymousEngagement(String(member._id), req.visitorId);

  return {
    refreshToken: token,
    accessToken: signMemberToken({ sub: String(member._id), v: member.tokenVersion }),
    member: publicMember(member),
  };
}

export async function register(
  input: {
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
    location?: string;
    subscribeToMovement: boolean;
  },
  req: Request
) {
  const email = input.email.toLowerCase();

  if (await Member.exists({ email })) {
    // Told plainly rather than obscured: unlike sign-in, a registration form
    // has to say the address is taken or the person cannot proceed. The
    // trade-off is accepted here and nowhere else.
    throw ApiError.conflict('An account already uses that email. Try signing in instead.');
  }

  const member = await Member.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email,
    passwordHash: await hashPassword(input.password),
    location: input.location,
    subscribedToMovement: input.subscribeToMovement,
  });

  // Joining the movement stays a separate record with its own consent trail.
  if (input.subscribeToMovement) {
    await Subscriber.updateOne(
      { email },
      {
        $set: {
          firstName: input.firstName,
          email,
          consentEmail: true,
          consentAt: new Date(),
          consentSource: 'member-registration',
          status: 'subscribed',
        },
      },
      { upsert: true }
    );
  }

  return issueSession(member, req);
}

export async function signIn(email: string, password: string, req: Request) {
  const member = await Member.findOne({ email: email.toLowerCase() }).select(
    '+passwordHash firstName lastName email location emailVerified subscribedToMovement isActive tokenVersion failedLoginAttempts lockedUntil lastLoginAt createdAt'
  );

  const generic = ApiError.unauthorized('That email and password combination did not work.');

  // Same message and comparable timing whether the account exists or not, so
  // the form cannot be used to discover who has registered.
  if (!member?.passwordHash) {
    await fakeVerify();
    throw generic;
  }

  if (member.lockedUntil && member.lockedUntil > new Date()) {
    throw ApiError.tooMany('Too many failed attempts. Try again in a few minutes.');
  }

  if (!(await verifyPassword(password, member.passwordHash))) {
    member.failedLoginAttempts += 1;
    if (member.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      member.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000);
      member.failedLoginAttempts = 0;
    }
    await member.save();
    throw generic;
  }

  if (!member.isActive) throw generic;

  member.failedLoginAttempts = 0;
  member.lockedUntil = null;
  member.lastLoginAt = new Date();
  await member.save();

  return issueSession(member, req);
}

export async function refresh(rawToken: string, req: Request) {
  const stored = await RefreshToken.findOne({
    tokenHash: hashToken(rawToken),
    subjectType: 'member',
  });
  if (!stored) throw ApiError.unauthorized('Your session has expired. Sign in again.');

  // Reuse of an already-rotated token means it was captured and replayed.
  if (stored.revokedAt) {
    logger.warn({ memberId: String(stored.userId) }, 'member refresh token reuse — revoking sessions');
    await RefreshToken.updateMany(
      { userId: stored.userId, subjectType: 'member', revokedAt: null },
      { revokedAt: new Date() }
    );
    await Member.updateOne({ _id: stored.userId }, { $inc: { tokenVersion: 1 } });
    throw ApiError.unauthorized('Your session was ended for security reasons. Sign in again.');
  }

  if (stored.expiresAt < new Date()) throw ApiError.unauthorized('Your session has expired.');

  const member = await Member.findById(stored.userId);
  if (!member?.isActive) throw ApiError.unauthorized('This account is no longer active.');

  const next = generateRefreshToken();
  stored.revokedAt = new Date();
  stored.replacedByHash = next.hash;
  await stored.save();

  await RefreshToken.create({
    userId: member._id,
    subjectType: 'member',
    tokenHash: next.hash,
    expiresAt: expiryDate(),
    userAgent: req.get('user-agent'),
    ip: req.ip,
  });

  return {
    refreshToken: next.token,
    accessToken: signMemberToken({ sub: String(member._id), v: member.tokenVersion }),
    member: publicMember(member),
  };
}

export async function signOut(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;
  await RefreshToken.updateOne(
    { tokenHash: hashToken(rawToken), subjectType: 'member', revokedAt: null },
    { revokedAt: new Date() }
  );
}

/**
 * Google sign-in for the public.
 *
 * The opposite policy to the CMS: here an unknown address creates an account.
 * Membership is open by design — the guide's north star is people joining the
 * movement — and members hold no permissions, so a new record grants nothing
 * beyond a place to keep someone's saved pieces and submissions.
 *
 * Matching is by verified email, which is why google.service refuses an
 * unverified one: without that check this would be a takeover of any member
 * account whose address someone could claim at Google.
 */
export async function signInWithGoogle(
  identity: { googleId: string; email: string; name: string; picture?: string },
  req: Request
) {
  const email = identity.email.toLowerCase();
  const existing = await Member.findOne({ email });

  if (existing) {
    if (!existing.isActive) {
      throw ApiError.forbidden('That account is no longer active.');
    }

    // First Google sign-in on a password account links the two rather than
    // creating a second record for the same person.
    if (!existing.googleId) existing.googleId = identity.googleId;
    if (!existing.avatarUrl && identity.picture) existing.avatarUrl = identity.picture;
    existing.emailVerified = true;
    existing.lastLoginAt = new Date();
    await existing.save();

    return issueSession(existing, req);
  }

  const [firstName, ...rest] = identity.name.split(' ');
  const member = await Member.create({
    firstName: firstName || email.split('@')[0],
    lastName: rest.join(' ') || undefined,
    email,
    googleId: identity.googleId,
    avatarUrl: identity.picture,
    // Google has already confirmed the address; asking them to confirm it again
    // is friction for a guarantee already held.
    emailVerified: true,
    // Not subscribed. Signing in is not consent to be emailed, and the guide
    // treats joining the mailing list as its own deliberate act.
    subscribedToMovement: false,
    lastLoginAt: new Date(),
  });

  return issueSession(member, req);
}
