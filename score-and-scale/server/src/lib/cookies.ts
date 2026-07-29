import type { CookieOptions, Response } from 'express'
import { env } from './env'
import { REFRESH_TTL_MS } from './jwt'

export const ACCESS_COOKIE = 'sas_access'
export const REFRESH_COOKIE = 'sas_refresh'
export const CSRF_COOKIE = 'sas_csrf'

const ACCESS_TTL_MS = 15 * 60 * 1000

/**
 * In production the browser (Netlify) and API (Render) sit on different sites,
 * so the session cookies must be SameSite=None, which browsers only accept
 * together with Secure. Locally both run on http://localhost, where Secure
 * would prevent the cookie being stored at all — hence the split.
 */
function baseOptions(): CookieOptions {
  return env.isProduction
    ? { httpOnly: true, secure: true, sameSite: 'none', path: '/' }
    : { httpOnly: true, secure: false, sameSite: 'lax', path: '/' }
}

export function setAccessCookie(res: Response, token: string): void {
  res.cookie(ACCESS_COOKIE, token, { ...baseOptions(), maxAge: ACCESS_TTL_MS })
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, { ...baseOptions(), maxAge: REFRESH_TTL_MS })
}

/**
 * The CSRF cookie is deliberately readable by JavaScript: the double-submit
 * pattern requires the client to echo it back in a header. It carries no
 * authority on its own — it only proves the caller can read this site's
 * cookies, which a cross-origin attacker cannot.
 */
export function setCsrfCookie(res: Response, token: string): void {
  res.cookie(CSRF_COOKIE, token, { ...baseOptions(), httpOnly: false, maxAge: REFRESH_TTL_MS })
}

export function clearAuthCookies(res: Response): void {
  const options = baseOptions()
  res.clearCookie(ACCESS_COOKIE, options)
  res.clearCookie(REFRESH_COOKIE, options)
  res.clearCookie(CSRF_COOKIE, { ...options, httpOnly: false })
}
