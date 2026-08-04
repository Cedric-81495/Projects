import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { env } from '../config/env.js';

export const COOKIE_NAME = 'h2c_admin';

export type AdminClaims = { sub: string; email: string; role: 'admin' };

export function signAdminToken(email: string): string {
  const payload: AdminClaims = { sub: email, email, role: 'admin' };
  const options: jwt.SignOptions = { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyAdminToken(token: string): AdminClaims {
  const decoded = jwt.verify(token, env.JWT_SECRET) as AdminClaims;
  if (decoded.role !== 'admin') throw new Error('Not an admin token');
  return decoded;
}

/** Set the auth cookie (httpOnly, sameSite, secure in prod). */
export function setAuthCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    // 'none' is required for cross-site cookies (frontend and API on different domains).
    sameSite: env.cookieSecure ? 'none' : 'lax',
    maxAge: 2 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSecure ? 'none' : 'lax',
    path: '/',
  });
}
