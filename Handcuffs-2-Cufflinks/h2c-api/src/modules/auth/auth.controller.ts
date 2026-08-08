import { Router } from 'express';
import { env } from '@/config/env';
import { ApiError } from '@/lib/ApiError';
import { asyncHandler } from '@/lib/asyncHandler';
import { ok } from '@/lib/envelope';
import { verifyCode } from '@/lib/totp';
import { MEMBER_REFRESH_COOKIE, REFRESH_COOKIE, refreshCookieOptions } from '@/lib/tokens';
import { audit } from '@/middleware/audit';
import { requireAuth } from '@/middleware/auth';
import { authLimiter } from '@/middleware/rateLimit';
import { validateBody } from '@/middleware/validate';
import { User } from '@/models/User';
import { hashPassword, verifyPassword } from '@/lib/password';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  mfaChallengeSchema,
  mfaCodeSchema,
  mfaDisableSchema,
  resetPasswordSchema,
  signInSchema,
  verifyEmailSchema,
} from './auth.schemas';
import * as account from './account.service';
import * as service from './auth.service';
import * as google from './google.service';
import * as mfa from './mfa.service';
import * as members from '../members/member.service';

export const authRouter = Router();

authRouter.post(
  '/sign-in',
  authLimiter,
  validateBody(signInSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };

    try {
      const result = await service.signIn(email, password, req);

      /**
       * Correct password, second factor outstanding. No cookie is set and no
       * access token is returned — the response carries only a short-lived
       * ticket the challenge endpoint will accept, so a caller who stops here
       * has gained nothing they can use.
       */
      if (result.mfaRequired) {
        audit(req, 'auth.sign-in.mfa-required', 'user', { actorEmail: email });
        ok(res, { mfaRequired: true, mfaToken: result.mfaToken });
        return;
      }

      res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());
      audit(req, 'auth.sign-in', 'user', { resourceId: result.user.id, actorEmail: result.user.email });
      // The refresh token goes in the cookie only — never the response body.
      ok(res, { user: result.user, accessToken: result.accessToken, mfaRequired: false });
    } catch (error) {
      audit(req, 'auth.sign-in', 'user', { outcome: 'failure', actorEmail: email, meta: { email } });
      throw error;
    }
  })
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) throw ApiError.unauthorized('No active session.');

    const session = await service.refresh(token, req);
    res.cookie(REFRESH_COOKIE, session.refreshToken, refreshCookieOptions());
    ok(res, { user: session.user, accessToken: session.accessToken });
  })
);

authRouter.post(
  '/sign-out',
  asyncHandler(async (req, res) => {
    await service.signOut(req.cookies?.[REFRESH_COOKIE] as string | undefined);
    res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined });
    ok(res, { signedOut: true });
  })
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.actor!.id);
    if (!user) throw ApiError.unauthorized();
    ok(res, service.publicUser(user));
  })
);

authRouter.post(
  '/password/change',
  requireAuth,
  authLimiter,
  validateBody(changePasswordSchema),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    const user = await User.findById(req.actor!.id).select('+passwordHash');
    if (!user?.passwordHash) throw ApiError.badRequest('This account has no password set.');

    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      audit(req, 'auth.password-change', 'user', { outcome: 'failure', resourceId: req.actor!.id });
      throw ApiError.badRequest('Your current password is not correct.');
    }

    user.passwordHash = await hashPassword(newPassword);
    // Signs out every other session — the expected behaviour after a password
    // change, and the point of it if the account was compromised.
    user.tokenVersion += 1;
    await user.save();

    audit(req, 'auth.password-change', 'user', { resourceId: req.actor!.id });
    ok(res, { changed: true }, 'Password updated. Other sessions have been signed out.');
  })
);

/* ================================================================== */
/* Multi-factor authentication                                         */
/* ================================================================== */

/**
 * Second step of sign-in.
 *
 * Rate limited on the same bucket as the password step. Six digits is a million
 * possibilities, which sounds ample until you notice a valid code lives for
 * ninety seconds — brute force is a real threat model here, not a theoretical
 * one, and the limiter is what makes the window unprofitable.
 */
authRouter.post(
  '/mfa/challenge',
  authLimiter,
  validateBody(mfaChallengeSchema),
  asyncHandler(async (req, res) => {
    const { mfaToken, code } = req.body as { mfaToken: string; code: string };

    let userId: string;
    try {
      userId = await mfa.completeChallenge(mfaToken, code);
    } catch (error) {
      audit(req, 'auth.mfa.challenge', 'user', { outcome: 'failure' });
      throw error;
    }

    const session = await service.issueSessionForUserId(userId, req);
    res.cookie(REFRESH_COOKIE, session.refreshToken, refreshCookieOptions());

    audit(req, 'auth.sign-in', 'user', {
      resourceId: session.user.id,
      actorEmail: session.user.email,
      meta: { secondFactor: true },
    });
    ok(res, { user: session.user, accessToken: session.accessToken, mfaRequired: false });
  })
);

authRouter.get(
  '/mfa',
  requireAuth,
  asyncHandler(async (req, res) => {
    ok(res, await mfa.status(req.actor!.id));
  })
);

authRouter.post(
  '/mfa/setup',
  requireAuth,
  authLimiter,
  asyncHandler(async (req, res) => {
    const enrolment = await mfa.beginEnrolment(req.actor!.id);
    audit(req, 'auth.mfa.setup-started', 'user', { resourceId: req.actor!.id });
    ok(res, enrolment, 'Scan the code in your authenticator app, then confirm the six digits it shows.');
  })
);

authRouter.post(
  '/mfa/enable',
  requireAuth,
  authLimiter,
  validateBody(mfaCodeSchema),
  asyncHandler(async (req, res) => {
    const { code } = req.body as { code: string };
    const result = await mfa.enable(req.actor!.id, code);

    audit(req, 'auth.mfa.enabled', 'user', { resourceId: req.actor!.id });
    ok(
      res,
      result,
      'Two-step verification is on. Save these recovery codes now — they are not shown again.'
    );
  })
);

/**
 * Turning it off needs the password and a current code.
 *
 * Both, not either. A signed-in session alone is not enough, because the thing
 * being removed is precisely what protects against a session that should not
 * exist.
 */
authRouter.post(
  '/mfa/disable',
  requireAuth,
  authLimiter,
  validateBody(mfaDisableSchema),
  asyncHandler(async (req, res) => {
    const { code, password } = req.body as { code: string; password: string };

    const user = await User.findById(req.actor!.id).select('+passwordHash');
    if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      audit(req, 'auth.mfa.disabled', 'user', { outcome: 'failure', resourceId: req.actor!.id });
      throw ApiError.badRequest('Your password is not correct.');
    }

    const result = await mfa.disable(req.actor!.id, code);
    audit(req, 'auth.mfa.disabled', 'user', { resourceId: req.actor!.id });
    ok(res, result, 'Two-step verification is off.');
  })
);

authRouter.post(
  '/mfa/recovery-codes',
  requireAuth,
  authLimiter,
  validateBody(mfaCodeSchema),
  asyncHandler(async (req, res) => {
    const { code } = req.body as { code: string };

    // Proven with a current code first: new codes invalidate the old set, so
    // an unproven caller could otherwise lock the real owner out of their own
    // recovery path.
    const userId = req.actor!.id;
    const user = await User.findById(userId).select('+mfaSecret mfaEnabled');
    if (!user?.mfaEnabled || !user.mfaSecret || !verifyCode(user.mfaSecret, code)) {
      throw ApiError.badRequest('Enter the current code from your authenticator app.');
    }

    const result = await mfa.regenerateRecoveryCodes(userId);
    audit(req, 'auth.mfa.recovery-codes-regenerated', 'user', { resourceId: userId });
    ok(res, result, 'New recovery codes issued. The previous set no longer works.');
  })
);

/* ================================================================== */
/* Password reset                                                      */
/* ================================================================== */

/**
 * Always answers the same way.
 *
 * Whether the address is registered is not something an anonymous caller gets
 * to learn from this endpoint, so success and "no such account" are one
 * response — and the message is written so it reads honestly in both cases
 * rather than claiming an email was sent when none was.
 */
authRouter.post(
  '/password/forgot',
  authLimiter,
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body as { email: string };

    await account.requestPasswordReset(email);
    audit(req, 'auth.password-reset.requested', 'user', { actorEmail: email });

    ok(
      res,
      { requested: true },
      'If that address has an account, a reset link is on its way. Check your inbox.'
    );
  })
);

authRouter.post(
  '/password/reset',
  authLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body as { token: string; newPassword: string };

    await account.completePasswordReset(token, newPassword);
    audit(req, 'auth.password-reset.completed', 'user');

    ok(res, { reset: true }, 'Password updated. Sign in with your new password.');
  })
);

/* ================================================================== */
/* Email verification                                                  */
/* ================================================================== */

authRouter.post(
  '/email/verify/request',
  requireAuth,
  authLimiter,
  asyncHandler(async (req, res) => {
    await account.sendVerificationEmail(req.actor!.id);
    ok(res, { sent: true }, 'Confirmation link sent. It is good for 24 hours.');
  })
);

/**
 * Public: the recipient is not signed in when they click the link in their
 * inbox, and requiring them to be defeats the purpose of confirming they can
 * receive mail at that address in the first place.
 */
authRouter.post(
  '/email/verify',
  authLimiter,
  validateBody(verifyEmailSchema),
  asyncHandler(async (req, res) => {
    const { token } = req.body as { token: string };

    const result = await account.verifyEmail(token);
    audit(req, 'auth.email-verified', 'user', { actorEmail: result.email });

    ok(res, result, 'Email address confirmed.');
  })
);

/* ================================================================== */
/* Google sign-in                                                      */
/* ================================================================== */

/**
 * Starts the flow.
 *
 * A redirect rather than a JSON payload with a URL in it: the browser has to
 * navigate to Google top-level for the consent screen to work, and returning
 * the URL would just mean the frontend performs the same redirect one step
 * later.
 */
authRouter.get(
  '/google',
  authLimiter,
  asyncHandler(async (_req, res) => {
    const { url, state } = google.buildAuthorizationUrl('cms');
    res.cookie(google.OAUTH_STATE_COOKIE, google.encodeState(state), google.stateCookieOptions());
    res.redirect(url);
  })
);

/**
 * Google's callback.
 *
 * Ends in a redirect to the CMS in every case, success or failure, because the
 * user is looking at a browser tab rather than reading a JSON body. The access
 * token travels in the URL fragment: a fragment is never sent to a server and
 * stays out of access logs, referrer headers, and the proxy chain, which a
 * query string would not.
 *
 * The rule that matters here: Google sign-in never creates a CMS account. It
 * matches an existing one by verified email and refuses otherwise. Self-service
 * registration into a system whose roles grant publishing and moderation rights
 * would mean anyone with a Google account could ask for the keys.
 *
 * This is also the single callback for BOTH flows. Google matches redirect URIs
 * against an exact allowlist configured in its console, so a second URI is a
 * second entry to register and keep in step across three environments. Which
 * side of the house a callback belongs to is decided by the `flow` field in the
 * signed state cookie — set before the browser ever left, so it cannot be
 * steered from the query string.
 */
authRouter.get(
  '/google/callback',
  authLimiter,
  asyncHandler(async (req, res) => {
    const failure = (reason: string): void => {
      res.clearCookie(google.OAUTH_STATE_COOKIE, { ...google.stateCookieOptions(), maxAge: undefined });
      const target = new URL(env.OAUTH_FAILURE_REDIRECT);
      target.searchParams.set('error', reason);
      res.redirect(target.toString());
    };

    const code = typeof req.query.code === 'string' ? req.query.code : undefined;
    const returnedState = typeof req.query.state === 'string' ? req.query.state : undefined;

    // The user pressed Cancel on Google's consent screen. Not an error worth
    // logging or alarming them about.
    if (typeof req.query.error === 'string') return failure('cancelled');
    if (!code) return failure('missing_code');

    let identity;
    let flow: 'cms' | 'member';
    try {
      const state = google.verifyState(req.cookies?.[google.OAUTH_STATE_COOKIE] as string | undefined, returnedState);
      flow = state.flow;
      identity = await google.exchangeCode(code, state.verifier);
    } catch {
      return failure('verification_failed');
    }

    res.clearCookie(google.OAUTH_STATE_COOKIE, { ...google.stateCookieOptions(), maxAge: undefined });

    /**
     * A public sign-in that happens to come back through this URL is handled as
     * a member, not silently processed as a failed staff attempt. Members are
     * created on first sign-in; staff are not.
     */
    if (flow === 'member') {
      const memberSession = await members.signInWithGoogle(identity, req);
      res.cookie(MEMBER_REFRESH_COOKIE, memberSession.refreshToken, refreshCookieOptions());

      const memberTarget = new URL(env.OAUTH_MEMBER_REDIRECT);
      memberTarget.hash = new URLSearchParams({ accessToken: memberSession.accessToken }).toString();
      return void res.redirect(memberTarget.toString());
    }

    const user = await User.findOne({ email: identity.email });
    if (!user || !user.isActive) {
      audit(req, 'auth.google.rejected', 'user', {
        outcome: 'failure',
        actorEmail: identity.email,
        meta: { reason: user ? 'inactive' : 'no-account' },
      });
      return failure('no_account');
    }

    /**
     * The enrolment policy applies whichever first factor was used. Google
     * proves an email address; it does not prove possession of an
     * authenticator, so an un-enrolled super administrator is refused here for
     * exactly the reason they are refused at the password step.
     */
    try {
      mfa.assertEnrolmentPolicy(user);
    } catch {
      return failure('mfa_enrolment_required');
    }

    /**
     * An account with MFA on cannot finish here: this endpoint has no way to
     * collect a code. Sent back to the password form, which does.
     */
    if (user.mfaEnabled) {
      const target = new URL(env.OAUTH_FAILURE_REDIRECT);
      target.searchParams.set('error', 'mfa_required');
      return void res.redirect(target.toString());
    }

    // First Google sign-in on an existing account links the two. Verified by
    // Google and matched on a confirmed address, so the local flag can follow.
    if (!user.googleId) {
      user.googleId = identity.googleId;
      user.emailVerified = true;
      if (!user.avatarUrl && identity.picture) user.avatarUrl = identity.picture;
      await user.save();
    }

    const session = await service.issueSessionForUserId(String(user._id), req);
    res.cookie(REFRESH_COOKIE, session.refreshToken, refreshCookieOptions());

    audit(req, 'auth.sign-in', 'user', {
      resourceId: session.user.id,
      actorEmail: session.user.email,
      meta: { provider: 'google' },
    });

    const target = new URL(env.OAUTH_SUCCESS_REDIRECT);
    target.hash = new URLSearchParams({ accessToken: session.accessToken }).toString();
    res.redirect(target.toString());
  })
);
