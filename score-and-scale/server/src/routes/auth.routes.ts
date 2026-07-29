import { Router } from 'express'
import { OAuth2Client } from 'google-auth-library'
import { z } from 'zod'
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  setAccessCookie,
  setRefreshCookie,
} from '../lib/cookies'
import { readOptionalGroup } from '../lib/env'
import { conflict, integrationUnavailable, unauthorized } from '../lib/errors'
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

const googleSchema = z.object({
  credential: z.string().min(1, 'Missing Google credential'),
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

// ---------------------------------------------------------------------------
// POST /api/auth/google
// ---------------------------------------------------------------------------
router.post(
  '/google',
  authLimiter,
  validate(googleSchema),
  asyncHandler(async (req, res) => {
    const config = readOptionalGroup(['GOOGLE_CLIENT_ID'] as const)
    if (!config) throw integrationUnavailable('Google sign-in')

    const { credential } = req.body as z.infer<typeof googleSchema>
    const oauthClient = new OAuth2Client(config.GOOGLE_CLIENT_ID)

    let payload
    try {
      const ticket = await oauthClient.verifyIdToken({
        idToken: credential,
        audience: config.GOOGLE_CLIENT_ID,
      })
      payload = ticket.getPayload()
    } catch {
      throw unauthorized('GOOGLE_TOKEN_INVALID', 'We could not verify that Google sign-in.')
    }

    if (!payload?.email || !payload.sub) {
      throw unauthorized('GOOGLE_TOKEN_INVALID', 'That Google account did not provide an email.')
    }

    /**
     * Google's own verification of the address is required before we trust it
     * to match an existing local account — otherwise an unverified Google
     * profile claiming a known email would take over that account.
     */
    if (payload.email_verified === false) {
      throw unauthorized('GOOGLE_EMAIL_UNVERIFIED', 'That Google email is not verified.')
    }

    const email = payload.email.toLowerCase()
    let user = (await User.findOne({ email }).select('+refreshSessions')) as UserDocument | null

    if (user) {
      // Link the Google identity to the existing account on first use.
      if (!user.googleId) user.googleId = payload.sub
      if (!user.avatarUrl && payload.picture) user.avatarUrl = payload.picture
      user.emailVerified = true
    } else {
      user = (await User.create({
        name: payload.name ?? email.split('@')[0] ?? 'Member',
        email,
        googleId: payload.sub,
        avatarUrl: payload.picture ?? '',
        emailVerified: true,
        role: 'user',
      })) as UserDocument
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
