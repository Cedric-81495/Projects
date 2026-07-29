import type { NextFunction, Request, Response } from 'express'
import { forbidden, unauthorized } from '../lib/errors'
import { User } from '../models/User'

/**
 * Must run after requireAuth.
 *
 * The role is re-read from Mongo rather than trusted from the access token: a
 * token minted before a demotion stays cryptographically valid for its full
 * 15-minute lifetime, and privileged routes should not honour a stale
 * elevation for that long.
 */
export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    next(unauthorized('NOT_AUTHENTICATED', 'You must be signed in to do that.'))
    return
  }

  try {
    const user = await User.findById(req.user.id).select('role').lean()

    if (!user || user.role !== 'admin') {
      next(forbidden('FORBIDDEN', 'Administrator access is required.'))
      return
    }

    req.user.role = user.role
    next()
  } catch (error) {
    next(error)
  }
}
