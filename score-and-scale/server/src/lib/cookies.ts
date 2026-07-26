import { CookieOptions } from 'express';

const isProd = process.env.NODE_ENV === 'production';

// FIX: the client (Vercel/Netlify/etc.) and this API (onrender.com) are on
// different origins — this is a cross-site deployment. Cookies with
// sameSite: 'strict' (or even 'lax') are NEVER attached to cross-site
// fetch() calls, so /me and /refresh always looked unauthenticated even
// right after a successful login. sameSite: 'none' is required for
// cross-site cookies, and the spec mandates secure: true whenever
// sameSite is 'none' (browsers silently drop the cookie otherwise).
//
// In local dev, client and server share http://localhost (same-site via
// port only), so 'lax' + secure:false is correct and simpler to debug with.
const crossSite: CookieOptions = isProd
  ? { secure: true, sameSite: 'none' }
  : { secure: false, sameSite: 'lax' };

export const accessTokenCookie: CookieOptions = {
  httpOnly: true,
  ...crossSite,
  maxAge: 15 * 60 * 1000, // 15 minutes
};

export const refreshTokenCookie: CookieOptions = {
  httpOnly: true,
  ...crossSite,
  path: '/api/auth/refresh', // only ever sent to the refresh endpoint
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const clearedAccessTokenCookie: CookieOptions = { ...accessTokenCookie, maxAge: 0 };
export const clearedRefreshTokenCookie: CookieOptions = { ...refreshTokenCookie, maxAge: 0 };
