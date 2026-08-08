import crypto from 'node:crypto';
import { env } from '@/config/env';
import { ApiError } from '@/lib/ApiError';
import { logger } from '@/lib/logger';

/**
 * Google OAuth 2.0, authorization-code flow.
 *
 * Written against fetch rather than pulled in through Passport. Passport would
 * add a session middleware the API deliberately does not have — it is
 * stateless, with its own token scheme — and the flow itself is three HTTP
 * calls. The strategy plugin would be more code to reason about than the
 * protocol it wraps.
 *
 * The identity comes from the userinfo endpoint using the freshly issued access
 * token, rather than from decoding the id_token locally. Both are valid; this
 * one avoids shipping a JWKS cache and the signature-verification code that
 * goes with it, and a server-to-server call over TLS to Google's own endpoint
 * is not a weaker guarantee.
 *
 * PKCE is used even though this is a confidential client with a secret. It
 * costs one hash and closes the interception window if the callback URL is ever
 * exposed through a redirect chain.
 */

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

export const OAUTH_STATE_COOKIE = 'h2c_oauth';
/** Long enough to sign in with, short enough that a stale tab fails cleanly. */
const STATE_TTL_MS = 10 * 60_000;

export type OAuthFlow = 'cms' | 'member';

export interface OAuthState {
  state: string;
  verifier: string;
  flow: OAuthFlow;
  issuedAt: number;
}

function assertConfigured(): void {
  if (!env.googleOAuthEnabled) {
    throw ApiError.badRequest('Google sign-in is not set up on this server.');
  }
}

function base64url(buffer: Buffer): string {
  return buffer.toString('base64url');
}

/**
 * Builds the redirect and the state to stash in a cookie.
 *
 * `state` defends the callback against CSRF; `verifier` is the PKCE secret,
 * sent only on the token exchange. Both live in a short-lived httpOnly cookie
 * rather than server memory, so the flow survives a Render instance restart
 * mid-sign-in — which on a free dyno is a routine occurrence, not an edge case.
 */
export function buildAuthorizationUrl(flow: OAuthFlow): { url: string; state: OAuthState } {
  assertConfigured();

  const state = base64url(crypto.randomBytes(24));
  const verifier = base64url(crypto.randomBytes(32));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID!,
    redirect_uri: env.GOOGLE_CALLBACK_URL!,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    // No refresh token is requested: the API never acts on Google's behalf
    // after sign-in, so holding one would be a credential kept for no reason.
    prompt: 'select_account',
  });

  return {
    url: `${AUTHORIZE_URL}?${params.toString()}`,
    state: { state, verifier, flow, issuedAt: Date.now() },
  };
}

export interface GoogleIdentity {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
}

/**
 * Exchanges the code for an identity.
 *
 * Throws for every failure mode with a message the browser can be redirected
 * with. Nothing here distinguishes "no such account" from "wrong account" —
 * that decision belongs to the caller, which knows whether it is signing in
 * staff or a member.
 */
export async function exchangeCode(code: string, verifier: string): Promise<GoogleIdentity> {
  assertConfigured();

  const tokenResponse = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: env.GOOGLE_CALLBACK_URL!,
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  });

  if (!tokenResponse.ok) {
    const detail = await tokenResponse.text().catch(() => '');
    logger.warn({ status: tokenResponse.status, detail: detail.slice(0, 300) }, 'google token exchange failed');
    throw ApiError.unauthorized('Google sign-in could not be completed.');
  }

  const tokens = (await tokenResponse.json()) as { access_token?: string };
  if (!tokens.access_token) throw ApiError.unauthorized('Google sign-in could not be completed.');

  const profileResponse = await fetch(USERINFO_URL, {
    headers: { authorization: `Bearer ${tokens.access_token}` },
  });

  if (!profileResponse.ok) {
    logger.warn({ status: profileResponse.status }, 'google userinfo lookup failed');
    throw ApiError.unauthorized('Google sign-in could not be completed.');
  }

  const profile = (await profileResponse.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };

  if (!profile.sub || !profile.email) {
    throw ApiError.unauthorized('Google did not return an email address for that account.');
  }

  /**
   * An unverified Google address is refused.
   *
   * Accounts are matched to existing records by email, so accepting one would
   * let anyone who can create a Google account claiming an address take over
   * the record belonging to it.
   */
  if (!profile.email_verified) {
    throw ApiError.forbidden('That Google account has not confirmed its email address.');
  }

  return {
    googleId: profile.sub,
    email: profile.email.toLowerCase(),
    emailVerified: true,
    name: profile.name?.trim() || profile.email.split('@')[0],
    picture: profile.picture,
  };
}

/** Cookie carrying state and verifier across the redirect to Google. */
export function stateCookieOptions() {
  return {
    httpOnly: true,
    secure: env.isProduction,
    /**
     * Lax, not None. Google's callback is a top-level GET navigation, which Lax
     * permits, and Lax additionally means the cookie is not attached to
     * cross-site subrequests — exactly the protection wanted on a value whose
     * only job is to prove this browser started the flow.
     */
    sameSite: 'lax' as const,
    path: '/',
    maxAge: STATE_TTL_MS,
  };
}

/**
 * Validates the round trip.
 *
 * The state in the cookie must match the one Google echoed back, and the whole
 * thing must be recent. Comparison is constant-time — the value is a secret, so
 * comparing it should not leak a prefix.
 */
export function verifyState(cookieValue: string | undefined, returnedState: string | undefined): OAuthState {
  if (!cookieValue || !returnedState) {
    throw ApiError.badRequest('That sign-in link has expired. Start again.');
  }

  let parsed: OAuthState;
  try {
    parsed = JSON.parse(Buffer.from(cookieValue, 'base64url').toString('utf8')) as OAuthState;
  } catch {
    throw ApiError.badRequest('That sign-in link is not valid. Start again.');
  }

  const expected = Buffer.from(parsed.state ?? '');
  const actual = Buffer.from(returnedState);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    logger.warn('oauth state mismatch — possible cross-site request forgery attempt');
    throw ApiError.badRequest('That sign-in request could not be verified. Start again.');
  }

  if (Date.now() - parsed.issuedAt > STATE_TTL_MS) {
    throw ApiError.badRequest('That sign-in link has expired. Start again.');
  }

  return parsed;
}

export function encodeState(state: OAuthState): string {
  return Buffer.from(JSON.stringify(state), 'utf8').toString('base64url');
}
