import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { env } from '../config/env.js';

export const USER_COOKIE_NAME = 'h2c_user';

export type UserClaims = { sub: string; email: string; role: 'user' | 'admin' };

export function signUserToken(claims: UserClaims): string {
  const options: jwt.SignOptions = {
    expiresIn: env.USER_JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(claims, env.JWT_SECRET, options);
}

export function verifyUserToken(token: string): UserClaims {
  const decoded = jwt.verify(token, env.JWT_SECRET) as UserClaims;
  if (decoded.role !== 'user' && decoded.role !== 'admin') {
    throw new Error('Not a user token');
  }
  return decoded;
}

const USER_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function setUserCookie(res: Response, token: string): void {
  res.cookie(USER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.cookieSecure,
    // 'none' for cross-site (frontend + API on different domains); 'lax' locally.
    sameSite: env.cookieSecure ? 'none' : 'lax',
    maxAge: USER_MAX_AGE_MS,
    path: '/',
  });
}

export function clearUserCookie(res: Response): void {
  res.clearCookie(USER_COOKIE_NAME, {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSecure ? 'none' : 'lax',
    path: '/',
  });
}
