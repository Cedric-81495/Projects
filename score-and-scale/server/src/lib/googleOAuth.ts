import crypto from 'node:crypto'
import { OAuth2Client } from 'google-auth-library'
import { env, readOptionalGroup } from './env'
import { integrationUnavailable, unauthorized } from './errors'

/**
 * Google OAuth 2.0 — authorization-code flow.
 *
 * The code flow (rather than the browser-side ID-token flow) is what
 * GOOGLE_CLIENT_SECRET and GOOGLE_CALLBACK_URL describe: the secret is only
 * meaningful when this server exchanges an authorization code server-to-server,
 * and the callback URL is where Google returns the browser.
 *
 * A practical benefit is that no Google SDK ships to the browser and no client
 * id is exposed in the bundle — the frontend only needs a link to our own
 * /api/auth/google endpoint.
 */

const GOOGLE_CONFIG_KEYS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL',
] as const

export function isGoogleOAuthConfigured(): boolean {
  return readOptionalGroup(GOOGLE_CONFIG_KEYS) !== null
}

function getConfig() {
  const config = readOptionalGroup(GOOGLE_CONFIG_KEYS)
  if (!config) throw integrationUnavailable('Google sign-in')
  return config
}

/**
 * A fresh client per call. OAuth2Client is stateful once tokens are attached to
 * it, so reusing a single instance across concurrent sign-ins risks one request
 * reading another's credentials.
 */
function createClient(): OAuth2Client {
  const config = getConfig()
  return new OAuth2Client(
    config.GOOGLE_CLIENT_ID,
    config.GOOGLE_CLIENT_SECRET,
    config.GOOGLE_CALLBACK_URL,
  )
}

export interface OAuthState {
  nonce: string
  /** Where to send the browser once authentication succeeds. */
  next?: string
}

/**
 * Builds the state cookie payload.
 *
 * The nonce is what actually defends the flow: it is echoed to Google, returned
 * in the callback, and compared against this cookie. Without that check an
 * attacker could feed a victim a callback URL carrying their own authorization
 * code and have the victim's browser adopt the attacker's session.
 */
export function createOAuthState(next?: string): { cookieValue: string; nonce: string } {
  const nonce = crypto.randomBytes(24).toString('base64url')
  const payload: OAuthState = next ? { nonce, next } : { nonce }
  return { cookieValue: JSON.stringify(payload), nonce }
}

export function parseOAuthState(cookieValue: string | undefined): OAuthState | null {
  if (!cookieValue) return null

  try {
    const parsed = JSON.parse(cookieValue) as unknown

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as OAuthState).nonce !== 'string'
    ) {
      return null
    }

    const state = parsed as OAuthState
    return typeof state.next === 'string' ? { nonce: state.nonce, next: state.next } : { nonce: state.nonce }
  } catch {
    return null
  }
}

/** Constant-time nonce comparison, so a mismatch leaks no timing signal. */
export function nonceMatches(expected: string, received: string | undefined): boolean {
  if (!received) return false

  const a = Buffer.from(expected)
  const b = Buffer.from(received)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export function buildGoogleAuthUrl(nonce: string): string {
  return createClient().generateAuthUrl({
    // No offline access: we never call Google's APIs on the user's behalf after
    // sign-in, so a refresh token would be a credential stored for no reason.
    access_type: 'online',
    scope: ['openid', 'email', 'profile'],
    state: nonce,
    // Always show the account chooser, so a shared machine does not silently
    // sign in as whoever used it last.
    prompt: 'select_account',
    include_granted_scopes: true,
  })
}

export interface GoogleProfile {
  googleId: string
  email: string
  emailVerified: boolean
  name: string
  picture: string
}

/**
 * Exchanges the authorization code and verifies the resulting ID token.
 *
 * Verification is not optional even though the token arrived over a
 * server-to-server exchange: verifyIdToken is what checks the signature,
 * issuer, expiry, and that the audience is our own client id.
 */
export async function exchangeCodeForProfile(code: string): Promise<GoogleProfile> {
  const config = getConfig()
  const client = createClient()

  let idToken: string | undefined

  try {
    const { tokens } = await client.getToken(code)
    idToken = tokens.id_token ?? undefined
  } catch {
    throw unauthorized('GOOGLE_CODE_INVALID', 'We could not complete that Google sign-in.')
  }

  if (!idToken) {
    throw unauthorized('GOOGLE_TOKEN_MISSING', 'Google did not return an identity token.')
  }

  let payload
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: config.GOOGLE_CLIENT_ID,
    })
    payload = ticket.getPayload()
  } catch {
    throw unauthorized('GOOGLE_TOKEN_INVALID', 'We could not verify that Google sign-in.')
  }

  if (!payload?.sub || !payload.email) {
    throw unauthorized('GOOGLE_PROFILE_INCOMPLETE', 'That Google account did not provide an email.')
  }

  /**
   * An unverified Google email must never be trusted to match an existing local
   * account — that would let someone register a Google profile claiming a known
   * address and take the account over.
   */
  if (payload.email_verified === false) {
    throw unauthorized('GOOGLE_EMAIL_UNVERIFIED', 'That Google email address is not verified.')
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: true,
    name: payload.name?.trim() || payload.email.split('@')[0] || 'Member',
    picture: payload.picture ?? '',
  }
}

/** Absolute URL the browser is sent to when OAuth fails, carrying an error code. */
export function buildFailureRedirect(code: string): string {
  const base = env.clientUrls[0] as string
  return `${base}/login?error=${encodeURIComponent(code)}`
}
