import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Middleware does three jobs and deliberately no more.
 *
 *  1. Refresh the Supabase session so a server component never sees an expired
 *     token mid-render.
 *  2. Apply security headers to every response, including a nonce-based CSP.
 *  3. Redirect unauthenticated browsers away from /dashboard.
 *
 * ⚠ That third job is a REDIRECT, not access control. It exists so people see a
 * sign-in page instead of an empty dashboard. The actual guarantee is the RLS
 * policy in 0006_rls.sql. Middleware runs on the edge, can be bypassed by
 * anything that speaks HTTP directly, and must never be the only thing standing
 * between a stranger and the client's paid content.
 *
 * ⚠ PHASE 1 BOUNDARY: the matcher below deliberately excludes `/`, `/830`,
 * `/thanks` and `/go/*`. Those routes are frozen for the Aug 30 event and this
 * middleware must not alter their responses.
 */

const PROTECTED_PREFIXES = ['/dashboard', '/learn', '/account', '/admin']

/** Only the origin of Jake's form may be framed — nothing else. */
const ghlOrigin = (() => {
  try {
    const u = process.env.NEXT_PUBLIC_GHL_FORM_URL
    return u ? new URL(u).origin : ''
  } catch {
    return ''
  }
})()

export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return applyHeaders(NextResponse.redirect(url), nonce)
  }

  return applyHeaders(response, nonce)
}

function applyHeaders(response: NextResponse, nonce: string) {
  const isDev = process.env.NODE_ENV === 'development'

  // `strict-dynamic` lets Next's own bundles load from the nonced entry script
  // without listing every chunk. 'unsafe-eval' is dev-only — React Refresh
  // needs it, production must not have it.
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: blob: https://*.supabase.co https://*.b-cdn.net`,
    `media-src 'self' blob: https://*.b-cdn.net https://iframe.mediadelivery.net`,
    // PostHog is reverse-proxied through /ingest on our own origin, so it needs
    // no third-party connect-src entry and is not blocked by ad blockers.
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.b-cdn.net`,
    // Bunny player + Stripe + Turnstile + Jake's GoHighLevel form. The GHL
    // origin is derived from the env value rather than hardcoded, so pointing
    // at a different sub-account does not require a code change.
    `frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com https://iframe.mediadelivery.net${ghlOrigin ? ' ' + ghlOrigin : ''}`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,       // clickjacking; supersedes X-Frame-Options
    `base-uri 'self'`,              // blocks <base> tag script hijacking
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ')

  const headers: Record<string, string> = {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(self), interest-cohort=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'X-Nonce': nonce,
  }

  if (!isDev) {
    // Two years, subdomains, preload-eligible. Only ever on HTTPS.
    headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload'
  }

  Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v))
  return response
}

export const config = {
  matcher: [
    /*
     * Everything except:
     *   · static assets and image optimisation
     *   · the frozen Aug 30 event surface: /event, /830, /thanks, /go/*
     *   · /api/webhooks/* — Stripe sends no cookies and must not be redirected
     */
    '/((?!_next/static|_next/image|favicon.ico|830|event|thanks|go/|api/webhooks|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$).*)',
  ],
}
