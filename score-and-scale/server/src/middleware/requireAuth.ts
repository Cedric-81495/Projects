import type { NextFunction, Request, Response } from 'express'
import { ACCESS_COOKIE } from '../lib/cookies'
import { unauthorized } from '../lib/errors'
import { isTokenExpiredError, verifyAccessToken, type UserRole } from '../lib/jwt'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: UserRole; email: string }
    }
  }
}

/**
 * Separates "no session at all" from "session expired".
 *
 * The distinction matters on the client: NOT_AUTHENTICATED means a guest and
 * should redirect to login, while TOKEN_EXPIRED means a returning user whose
 * access token lapsed and is the *only* condition that triggers a refresh
 * attempt. Treating every 401 as refreshable causes a refresh storm on guest
 * traffic.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[ACCESS_COOKIE]

  if (!token) {
    next(unauthorized('NOT_AUTHENTICATED', 'You must be signed in to do that.'))
    return
  }

  try {
    const claims = verifyAccessToken(token)
    req.user = { id: claims.sub, role: claims.role, email: claims.email }
    next()
  } catch (error) {
    if (isTokenExpiredError(error)) {
      next(unauthorized('TOKEN_EXPIRED', 'Your session has expired.'))
      return
    }
    next(unauthorized('NOT_AUTHENTICATED', 'Your session is no longer valid.'))
  }
}

/** Populates req.user when a valid token exists, but never rejects. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[ACCESS_COOKIE]
  if (!token) return next()

  try {
    const claims = verifyAccessToken(token)
    req.user = { id: claims.sub, role: claims.role, email: claims.email }
  } catch {
    // An invalid token is treated exactly like no token on public routes.
  }
  next()
}
