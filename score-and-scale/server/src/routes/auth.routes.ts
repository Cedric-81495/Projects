import { Router } from 'express'
import { z } from 'zod'
import {
  OAUTH_STATE_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  clearOAuthStateCookie,
  setAccessCookie,
  setOAuthStateCookie,
  setRefreshCookie,
} from '../lib/cookies'
import { safeClientRedirect } from '../lib/env'
import { conflict, unauthorized } from '../lib/errors'
import {
  buildFailureRedirect,
  buildGoogleAuthUrl,
  createOAuthState,
  exchangeCodeForProfile,
  isGoogleOAuthConfigured,
  nonceMatches,
  parseOAuthState,
  type GoogleProfile,
} from '../lib/googleOAuth'
import {
  hashToken,
  isTokenExpiredError,
  newSessionId,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_TTL_MS,
} from '../lib/jwt'
import { logger } from '../lib/logger'
import { asyncHandler } from '../middleware/errorHandler'
import { deriveCsrfToken } from '../middleware/csrf'
import { authLimiter } from '../middleware/rateLimit'
import { requireAuth } from '../middleware/requireAuth'
import { validate } from '../middleware/validate'
import { User, hashPassword, type UserDocument } from '../models/User'

const router = Router()

/**
 * Password policy: length is the property that actually resists offline
 * cracking, so a 10-character minimum is required rather than a short password
 * padded with symbol classes that users work around predictably.
 */
const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(200, 'Password is too long')

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  password: passwordSchema,
})

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  password: z.string().min(1, 'Please enter your password'),
})

/** Shape returned to the client for the signed-in user. */
function publicUser(user: { _id: unknown; name: string; email: string; role: string; avatarUrl?: string }) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? '',
  }
}

/**
 * Issues a fresh token pair and records the refresh lineage.
 *
 * Expired sessions are pruned on every issue, which keeps the embedded array
 * bounded without needing a scheduled job.
 */
async function issueSession(
  user: UserDocument,
  context: { userAgent: string; ip: string },
  sid = newSessionId(),
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = signAccessToken({
    sub: String(user._id),
    role: user.role as 'user' | 'admin',
    email: user.email,
  })
  const refreshToken = signRefreshToken({ sub: String(user._id), sid })

  const now = Date.now()
  /**
   * Mapped to plain objects before appending. The hydrated value is a Mongoose
   * DocumentArray whose push() only accepts subdocuments, so building a plain
   * array and handing it to set() is what lets a new entry be added.
   */
  const sessions = (user.refreshSessions ?? [])
    .filter((session) => new Date(session.expiresAt).getTime() > now && session.sid !== sid)
    .map((session) => ({
      sid: session.sid,
      tokenHash: session.tokenHash,
      userAgent: session.userAgent,
      ip: session.ip,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    }))

  sessions.push({
    sid,
    tokenHash: hashToken(refreshToken),
    userAgent: context.userAgent.slice(0, 300),
    ip: context.ip,
    createdAt: new Date(),
    expiresAt: new Date(now + REFRESH_TTL_MS),
  })

  user.set('refreshSessions', sessions)
  user.lastLoginAt = new Date()
  await user.save()

  return { accessToken, refreshToken }
}

function requestContext(req: { get(name: string): string | undefined; ip?: string }) {
  return { userAgent: req.get('user-agent') ?? '', ip: req.ip ?? '' }
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body as z.infer<typeof registerSchema>

    const existing = await User.findOne({ email }).select('_id').lean()
    if (existing) throw conflict('EMAIL_IN_USE', 'An account with that email already exists.')

    const user = (await User.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      role: 'user',
    })) as UserDocument

    const { accessToken, refreshToken } = await issueSession(user, requestContext(req))
    setAccessCookie(res, accessToken)
    setRefreshCookie(res, refreshToken)

    res.status(201).json({
      code: 'REGISTERED',
      user: publicUser(user),
      csrfToken: deriveCsrfToken(refreshToken),
    })
  }),
)

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>

    // passwordHash and refreshSessions are select:false, so ask for them.
    const user = (await User.findOne({ email }).select('+passwordHash +refreshSessions')) as
      | UserDocument
      | null

    /**
     * One generic failure for "no such account" and "wrong password". Splitting
     * them would let an attacker enumerate which emails are registered.
     */
    if (!user || !(await user.verifyPassword(password))) {
      throw unauthorized('INVALID_CREDENTIALS', 'That email or password is incorrect.')
    }

    const { accessToken, refreshToken } = await issueSession(user, requestContext(req))
    setAccessCookie(res, accessToken)
    setRefreshCookie(res, refreshToken)

    res.json({
      code: 'LOGIN_OK',
      user: publicUser(user),
      csrfToken: deriveCsrfToken(refreshToken),
    })
  }),
)

/**
 * Resolves a Google profile to a local account.
 *
 * One function serves both "sign in with Google" and "sign up with Google" —
 * they are the same operation, distinguished only by whether the email already
 * exists. Keeping it in one place is what guarantees a returning user is linked
 * rather than duplicated.
 */
async function resolveGoogleUser(profile: GoogleProfile): Promise<{
  user: UserDocument
  created: boolean
}> {
  const existing = (await User.findOne({ email: profile.email }).select(
    '+refreshSessions',
  )) as UserDocument | null

  if (existing) {
    /**
     * Link the Google identity to the account that already owns this email.
     * The address is verified by Google at this point, so this is the intended
     * "same person, new sign-in method" path rather than a takeover.
     *
     * Existing fields are preserved: a user who set their own name or avatar
     * should not have it overwritten by their Google profile on every sign-in.
     */
    if (!existing.googleId) existing.googleId = profile.googleId
    if (!existing.avatarUrl && profile.picture) existing.avatarUrl = profile.picture
    existing.emailVerified = true

    return { user: existing, created: false }
  }

  const created = (await User.create({
    name: profile.name,
    email: profile.email,
    googleId: profile.googleId,
    avatarUrl: profile.picture,
    emailVerified: true,
    // Role is always 'user'. Elevation happens only through the CLI script, so
    // no OAuth path can mint an administrator.
    role: 'user',
  })) as UserDocument

  return { user: created, created: true }
}

// ---------------------------------------------------------------------------
// GET /api/auth/google — begin the authorization-code flow
// ---------------------------------------------------------------------------
router.get(
  '/google',
  authLimiter,
  asyncHandler(async (req, res) => {
    /**
     * This route is a browser navigation, so an unconfigured integration must
     * redirect with an error code rather than throw — a raw 503 JSON body is not
     * something to show someone who just clicked a button.
     */
    if (!isGoogleOAuthConfigured()) {
      res.redirect(buildFailureRedirect('GOOGLE_NOT_CONFIGURED'))
      return
    }

    const requestedNext = typeof req.query.next === 'string' ? req.query.next : undefined

    /**
     * The nonce goes to Google in `state` and its twin into an httpOnly cookie.
     * On the way back the two must match, which is what stops an attacker
     * replaying their own authorization code in a victim's browser.
     */
    const { cookieValue, nonce } = createOAuthState(requestedNext)
    setOAuthStateCookie(res, cookieValue)

    res.redirect(buildGoogleAuthUrl(nonce))
  }),
)

// ---------------------------------------------------------------------------
// GET /api/auth/google/callback — Google returns the browser here
//
// Exported so index.ts can additionally serve it at whatever path
// GOOGLE_CALLBACK_URL specifies, without duplicating the handler.
// ---------------------------------------------------------------------------
export const googleCallbackHandler = asyncHandler(async (req, res) => {
    const state = parseOAuthState(req.cookies?.[OAUTH_STATE_COOKIE])
    // Single-use: consumed whatever the outcome, so a code cannot be retried.
    clearOAuthStateCookie(res)

    /**
     * This endpoint is a browser navigation, not an XHR. Failures therefore
     * redirect to the login page with an error code rather than returning JSON
     * the user would see as raw text.
     */
    if (typeof req.query.error === 'string') {
      res.redirect(buildFailureRedirect('GOOGLE_ACCESS_DENIED'))
      return
    }

    const code = typeof req.query.code === 'string' ? req.query.code : undefined
    const returnedState = typeof req.query.state === 'string' ? req.query.state : undefined

    if (!code || !state || !nonceMatches(state.nonce, returnedState)) {
      logger.warn('Rejected a Google callback with a missing or mismatched state', {
        hasCode: Boolean(code),
        hasStateCookie: Boolean(state),
      })
      res.redirect(buildFailureRedirect('GOOGLE_STATE_INVALID'))
      return
    }

    let profile: GoogleProfile
    try {
      profile = await exchangeCodeForProfile(code)
    } catch (error) {
      const failureCode =
        error instanceof Error && 'code' in error && typeof error.code === 'string'
          ? error.code
          : 'GOOGLE_SIGNIN_FAILED'
      res.redirect(buildFailureRedirect(failureCode))
      return
    }

    const { user, created } = await resolveGoogleUser(profile)

    // Identical session issuance to password login: same cookies, same rotation
    // lineage, same 15-minute access token.
    const { accessToken, refreshToken } = await issueSession(user, requestContext(req))
    setAccessCookie(res, accessToken)
    setRefreshCookie(res, refreshToken)

    logger.info(created ? 'Created an account via Google' : 'Signed in via Google', {
      userId: String(user._id),
    })

    /**
     * Administrators land on the admin console, everyone else on the dashboard,
     * unless an explicit destination survived the round trip.
     *
     * The CSRF token cannot travel in a redirect — there is no readable body —
     * so the client picks it up from /me on the next page load.
     */
    const fallback = user.role === 'admin' ? '/admin' : '/dashboard'
    res.redirect(safeClientRedirect(state.next, fallback))
})

router.get('/google/callback', authLimiter, googleCallbackHandler)

// ---------------------------------------------------------------------------
// POST /api/auth/refresh — rotation with reuse detection
// ---------------------------------------------------------------------------
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE]
    if (!token) throw unauthorized('NOT_AUTHENTICATED', 'You are not signed in.')

    let claims
    try {
      claims = verifyRefreshToken(token)
    } catch (error) {
      clearAuthCookies(res)
      throw unauthorized(
        isTokenExpiredError(error) ? 'SESSION_EXPIRED' : 'NOT_AUTHENTICATED',
        'Please sign in again.',
      )
    }

    const user = (await User.findById(claims.sub).select('+refreshSessions')) as UserDocument | null
    if (!user) {
      clearAuthCookies(res)
      throw unauthorized('NOT_AUTHENTICATED', 'Please sign in again.')
    }

    const presentedHash = hashToken(token)
    const sessions = user.refreshSessions ?? []
    const match = sessions.find((session) => session.tokenHash === presentedHash)

    /**
     * Reuse detection.
     *
     * The signature is valid but this exact token is no longer the live one for
     * its lineage, which means it was already rotated. The only ways that
     * happens are a stolen token being replayed, or a client racing itself.
     * Both are handled the same way: destroy the entire lineage so neither the
     * attacker nor the victim keeps a usable session, and force a fresh login.
     */
    if (!match) {
      const familyExisted = sessions.some((session) => session.sid === claims.sid)
      user.set(
        'refreshSessions',
        sessions.filter((session) => session.sid !== claims.sid),
      )
      await user.save()
      clearAuthCookies(res)

      if (familyExisted) {
        logger.warn('Refresh token reuse detected — session family revoked', {
          userId: String(user._id),
          sid: claims.sid,
        })
      }

      throw unauthorized('SESSION_EXPIRED', 'Please sign in again.')
    }

    if (new Date(match.expiresAt).getTime() <= Date.now()) {
      user.set(
        'refreshSessions',
        sessions.filter((session) => session.tokenHash !== presentedHash),
      )
      await user.save()
      clearAuthCookies(res)
      throw unauthorized('SESSION_EXPIRED', 'Please sign in again.')
    }

    // Rotate in place: same lineage id, brand-new token pair.
    const { accessToken, refreshToken } = await issueSession(
      user,
      requestContext(req),
      claims.sid,
    )
    setAccessCookie(res, accessToken)
    setRefreshCookie(res, refreshToken)

    res.json({
      code: 'REFRESHED',
      user: publicUser(user),
      csrfToken: deriveCsrfToken(refreshToken),
    })
  }),
)

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    /**
     * The role is re-read from Mongo rather than taken from the token, so a
     * promotion or demotion is reflected immediately instead of at the end of
     * the access token's lifetime.
     */
    const user = await User.findById(req.user!.id)
      .select('name email role avatarUrl')
      .lean()

    if (!user) {
      clearAuthCookies(res)
      throw unauthorized('NOT_AUTHENTICATED', 'Please sign in again.')
    }

    const refreshToken = req.cookies?.[REFRESH_COOKIE]

    res.json({
      code: 'AUTHENTICATED',
      user: publicUser(user),
      // Lets a reloaded tab recover its CSRF token without a full re-login.
      ...(refreshToken ? { csrfToken: deriveCsrfToken(refreshToken) } : {}),
    })
  }),
)

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE]

    // Revoke only this device's lineage; other sessions stay signed in.
    if (token) {
      try {
        const claims = verifyRefreshToken(token)
        await User.updateOne(
          { _id: claims.sub },
          { $pull: { refreshSessions: { sid: claims.sid } } },
        )
      } catch {
        // An unverifiable token has nothing to revoke; clearing cookies is enough.
      }
    }

    clearAuthCookies(res)
    res.json({ code: 'LOGGED_OUT' })
  }),
)

// ---------------------------------------------------------------------------
// POST /api/auth/logout-all — sign out every device
// ---------------------------------------------------------------------------
router.post(
  '/logout-all',
  requireAuth,
  asyncHandler(async (req, res) => {
    await User.updateOne({ _id: req.user!.id }, { $set: { refreshSessions: [] } })
    clearAuthCookies(res)
    res.json({ code: 'LOGGED_OUT' })
  }),
)

export default router
