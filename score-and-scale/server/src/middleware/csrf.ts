import crypto from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { REFRESH_COOKIE } from '../lib/cookies'
import { env } from '../lib/env'
import { forbidden } from '../lib/errors'

export const CSRF_HEADER = 'x-csrf-token'

/**
 * CSRF defence for a cross-site cookie session.
 *
 * Session cookies must be SameSite=None in production (Netlify frontend,
 * Render API), which means the browser attaches them to cross-site requests —
 * exactly the condition CSRF exploits. The usual double-submit cookie does not
 * work here: a cookie set by the Render domain is not readable by JavaScript
 * running on the Netlify origin, so the client could never echo it back.
 *
 * Instead the token is derived server-side as an HMAC of the refresh cookie and
 * returned in the *response body* of /login, /refresh and /me. Only a caller
 * permitted by CORS can read that body, and the value cannot be forged without
 * the signing secret. Two independent barriers therefore protect every mutating
 * authenticated route:
 *
 *   1. The custom header forces a CORS preflight, which a disallowed origin
 *      fails — so the request is never sent.
 *   2. The HMAC must match, so even a leaked request shape is not replayable
 *      against a different session.
 */
export function deriveCsrfToken(refreshToken: string): string {
  return crypto
    .createHmac('sha256', env.JWT_REFRESH_SECRET)
    .update(`csrf:${refreshToken}`)
    .digest('base64url')
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function requireCsrf(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next()
    return
  }

  const refreshToken = req.cookies?.[REFRESH_COOKIE]

  // No session cookie means there is no authority to abuse, so there is
  // nothing for CSRF to steal. Authentication middleware handles rejection.
  if (!refreshToken) {
    next()
    return
  }

  const provided = req.get(CSRF_HEADER)
  if (!provided) {
    next(forbidden('CSRF_TOKEN_MISSING', 'Missing CSRF token.'))
    return
  }

  const expected = deriveCsrfToken(refreshToken)
  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(expected)

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    next(forbidden('CSRF_TOKEN_INVALID', 'Invalid CSRF token.'))
    return
  }

  next()
}
