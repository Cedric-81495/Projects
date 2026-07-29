import type { CookieOptions, Response } from 'express'
import { env } from './env'
import { REFRESH_TTL_MS } from './jwt'

export const ACCESS_COOKIE = 'sas_access'
export const REFRESH_COOKIE = 'sas_refresh'
export const CSRF_COOKIE = 'sas_csrf'
export const OAUTH_STATE_COOKIE = 'sas_oauth_state'

const ACCESS_TTL_MS = 15 * 60 * 1000
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000

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

/**
 * Short-lived cookie holding the OAuth state nonce and intended destination.
 *
 * httpOnly, because only the server ever reads it back. SameSite must permit the
 * cookie to survive Google's top-level redirect back to the callback: 'lax' does
 * allow that for a GET navigation, and production needs 'none' anyway since the
 * API and the site are on different sites.
 */
export function setOAuthStateCookie(res: Response, value: string): void {
  res.cookie(OAUTH_STATE_COOKIE, value, { ...baseOptions(), maxAge: OAUTH_STATE_TTL_MS })
}

export function clearOAuthStateCookie(res: Response): void {
  res.clearCookie(OAUTH_STATE_COOKIE, baseOptions())
}

export function clearAuthCookies(res: Response): void {
  const options = baseOptions()
  res.clearCookie(ACCESS_COOKIE, options)
  res.clearCookie(REFRESH_COOKIE, options)
  res.clearCookie(CSRF_COOKIE, { ...options, httpOnly: false })
}
