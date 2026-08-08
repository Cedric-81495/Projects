import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import type { Role } from '@/types/auth';

/**
 * Token strategy.
 *
 * Access token: short-lived JWT, returned in the response body and held in
 * memory by the browser. Never written to localStorage, so an XSS bug cannot
 * lift a durable credential.
 *
 * Refresh token: opaque random string in an httpOnly cookie. Only its SHA-256
 * hash is stored, so a database leak does not hand over usable sessions. It is
 * rotated on every use — see the reuse detection in the auth service.
 */
export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_DAYS = 30;
export const REFRESH_COOKIE = 'h2c_rt';
/** Members get their own cookie so a member and an admin can be signed in at once. */
export const MEMBER_REFRESH_COOKIE = 'h2c_mrt';

/**
 * Token audiences.
 *
 * Staff and members are separate audiences on purpose. A member's access token
 * therefore fails signature verification on any admin route before permissions
 * are even consulted — so a missing requirePermission() on some future CMS
 * route cannot quietly expose it to the public. Roles alone would not give that
 * guarantee.
 */
export const CMS_AUDIENCE = 'h2c-cms';
export const MEMBER_AUDIENCE = 'h2c-members';

export interface AccessPayload {
  sub: string;
  role: Role;
  /** Bumped when a user is disabled or their role changes, invalidating tokens. */
  v: number;
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TTL_SECONDS,
    issuer: 'h2c-api',
    audience: CMS_AUDIENCE,
  });
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'h2c-api',
    audience: CMS_AUDIENCE,
  }) as AccessPayload;
}

export interface MemberPayload {
  sub: string;
  v: number;
}

export function signMemberToken(payload: MemberPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TTL_SECONDS,
    issuer: 'h2c-api',
    audience: MEMBER_AUDIENCE,
  });
}

export function verifyMemberToken(token: string): MemberPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'h2c-api',
    audience: MEMBER_AUDIENCE,
  }) as MemberPayload;
}

/** Opaque refresh token. Returned once; only the hash is persisted. */
export function generateRefreshToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(48).toString('base64url');
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function refreshCookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: 'none' | 'lax';
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: env.isProduction,
    /**
     * The CMS is served from Vercel while the API runs on Render, so the cookie
     * is cross-site in deployed environments and must be SameSite=None, which
     * browsers only accept alongside Secure. Locally both are on localhost, so
     * Lax works and avoids requiring HTTPS in development.
     */
    sameSite: env.isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}
