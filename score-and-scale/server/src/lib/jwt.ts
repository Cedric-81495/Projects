import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from './env'

export type UserRole = 'user' | 'admin'

export interface AccessTokenClaims {
  sub: string
  role: UserRole
  email: string
}

export interface RefreshTokenClaims {
  sub: string
  /** Rotation family id. Lets us revoke a whole lineage on reuse. */
  sid: string
}

const ACCESS_TTL = '15m'
const REFRESH_TTL_DAYS = 30
export const REFRESH_TTL_MS = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000

export function signAccessToken(claims: AccessTokenClaims): string {
  return jwt.sign(claims, env.JWT_SECRET, { expiresIn: ACCESS_TTL })
}

export function signRefreshToken(claims: RefreshTokenClaims): string {
  return jwt.sign(claims, env.JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_TTL_DAYS}d` })
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenClaims & jwt.JwtPayload
}

export function verifyRefreshToken(token: string): RefreshTokenClaims {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenClaims & jwt.JwtPayload
}

export function isTokenExpiredError(error: unknown): boolean {
  return error instanceof jwt.TokenExpiredError
}

export function newSessionId(): string {
  return crypto.randomUUID()
}

/**
 * Refresh tokens are stored as SHA-256 digests. A database dump therefore
 * cannot be replayed against the API, and comparison stays constant-time-ish
 * because we look the digest up by index rather than comparing strings.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
