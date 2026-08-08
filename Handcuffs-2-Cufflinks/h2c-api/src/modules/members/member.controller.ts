import { Router } from 'express';
import { ApiError } from '@/lib/ApiError';
import { asyncHandler } from '@/lib/asyncHandler';
import { created, ok } from '@/lib/envelope';
import { hashPassword, verifyPassword } from '@/lib/password';
import { MEMBER_REFRESH_COOKIE, refreshCookieOptions } from '@/lib/tokens';
import { authLimiter, submissionLimiter } from '@/middleware/rateLimit';
import { requireMember } from '@/middleware/memberAuth';
import { validateBody } from '@/middleware/validate';
import { attachVisitor } from '@/middleware/visitor';
import { Engagement } from '@/models/engagement';
import { Member } from '@/models/Member';
import { RefreshToken } from '@/models/RefreshToken';
import {
  changeMemberPasswordSchema,
  memberSignInSchema,
  registerSchema,
  updateProfileSchema,
} from './member.schemas';
import * as service from './member.service';

export const memberRouter = Router();

// Engagement claiming needs the anonymous visitor id, so it is attached here.
memberRouter.use(attachVisitor);

memberRouter.post(
  '/register',
  submissionLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      firstName: string; lastName?: string; email: string; password: string;
      location?: string; subscribeToMovement: boolean;
    };

    const session = await service.register(body, req);
    res.cookie(MEMBER_REFRESH_COOKIE, session.refreshToken, refreshCookieOptions());
    created(
      res,
      { member: session.member, accessToken: session.accessToken },
      'Welcome to the movement.'
    );
  })
);

memberRouter.post(
  '/sign-in',
  authLimiter,
  validateBody(memberSignInSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    const session = await service.signIn(email, password, req);
    res.cookie(MEMBER_REFRESH_COOKIE, session.refreshToken, refreshCookieOptions());
    ok(res, { member: session.member, accessToken: session.accessToken });
  })
);

memberRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[MEMBER_REFRESH_COOKIE] as string | undefined;
    if (!token) throw ApiError.unauthorized('No active session.');

    const session = await service.refresh(token, req);
    res.cookie(MEMBER_REFRESH_COOKIE, session.refreshToken, refreshCookieOptions());
    ok(res, { member: session.member, accessToken: session.accessToken });
  })
);

memberRouter.post(
  '/sign-out',
  asyncHandler(async (req, res) => {
    await service.signOut(req.cookies?.[MEMBER_REFRESH_COOKIE] as string | undefined);
    res.clearCookie(MEMBER_REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
    ok(res, { signedOut: true });
  })
);

memberRouter.get(
  '/me',
  requireMember,
  asyncHandler(async (req, res) => {
    const member = await Member.findById(req.member!.id);
    if (!member) throw ApiError.unauthorized();
    ok(res, service.publicMember(member));
  })
);

memberRouter.patch(
  '/me',
  requireMember,
  validateBody(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const member = await Member.findByIdAndUpdate(req.member!.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!member) throw ApiError.unauthorized();
    ok(res, service.publicMember(member));
  })
);

/** The point of having an account: reactions that follow you between devices. */
memberRouter.get(
  '/me/engagement',
  requireMember,
  asyncHandler(async (req, res) => {
    const rows = await Engagement.find({ memberId: req.member!.id })
      .select('itemId action')
      .populate('itemId', 'name slug badge assetSpec');

    const grouped: Record<string, string[]> = { like: [], favorite: [], vote: [], notify: [] };
    for (const row of rows) {
      const id = String((row.itemId as unknown as { _id?: unknown })?._id ?? row.itemId);
      (grouped[row.action] ??= []).push(id);
    }
    ok(res, grouped);
  })
);

memberRouter.post(
  '/me/password',
  requireMember,
  authLimiter,
  validateBody(changeMemberPasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string; newPassword: string;
    };

    const member = await Member.findById(req.member!.id).select('+passwordHash');
    if (!member?.passwordHash) throw ApiError.unauthorized();

    if (!(await verifyPassword(currentPassword, member.passwordHash))) {
      throw ApiError.badRequest('Your current password is not correct.');
    }

    member.passwordHash = await hashPassword(newPassword);
    // Ends every other session — the expected behaviour after a password change,
    // and the whole point of it if the account was compromised.
    member.tokenVersion += 1;
    await member.save();

    await RefreshToken.updateMany(
      { userId: member._id, subjectType: 'member', revokedAt: null },
      { revokedAt: new Date() }
    );

    res.clearCookie(MEMBER_REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
    ok(res, { changed: true }, 'Password updated. Please sign in again.');
  })
);

/**
 * Account deletion, by the member themselves.
 *
 * Their reactions are detached rather than deleted: the counts informed real
 * production decisions and rewriting that history would falsify the record.
 * Detached rows keep no link to the person.
 */
memberRouter.delete(
  '/me',
  requireMember,
  asyncHandler(async (req, res) => {
    const id = req.member!.id;
    await Engagement.updateMany({ memberId: id }, { memberId: null });
    await RefreshToken.updateMany(
      { userId: id, subjectType: 'member', revokedAt: null },
      { revokedAt: new Date() }
    );
    await Member.deleteOne({ _id: id });

    res.clearCookie(MEMBER_REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
    ok(res, { deleted: true }, 'Your account has been removed.');
  })
);
