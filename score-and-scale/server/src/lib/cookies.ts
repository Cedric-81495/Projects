import { CookieOptions } from 'express';

const isProd = process.env.NODE_ENV === 'production';

export const accessTokenCookie: CookieOptions = {
  httpOnly: true,
  secure: isProd, // must be true in production (HTTPS) — false is fine for local http dev
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000, // 15 minutes
};

export const refreshTokenCookie: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict',
  path: '/api/auth/refresh', // only ever sent to the refresh endpoint
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const clearedAccessTokenCookie: CookieOptions = { ...accessTokenCookie, maxAge: 0 };
export const clearedRefreshTokenCookie: CookieOptions = { ...refreshTokenCookie, maxAge: 0 };
