import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/* Routes that require a session.

   Corrected: `/learn` and `/account` were listed but do not exist as routes,
   while `/app` — the actual student area, `/app/[level]/[module]` — was not
   listed at all. The middleware was guarding two 404s and missing the pages
   that hold the content.

   ⚠ Still only a REDIRECT, not access control. It exists so a signed-out
   visitor sees a sign-in page instead of an empty shell. The real guarantee is
   the RLS policy in 0006_rls.sql: middleware runs at the edge, can be bypassed
   by anything speaking HTTP directly, and must never be the only thing between
   a stranger and the client's paid content. */
const PROTECTED_PREFIXES = ['/dashboard', '/admin', '/app']

/* Pages that make no sense with a session already in hand. Without this, a
   browser-back to a cached /login shows a form to someone who is already
   signed in — and every submit burns one of their five auth attempts per
   fifteen minutes, so they lock themselves out of an account they are already
   inside. */
const AUTH_PAGES = ['/login', '/signup']

/** Only the origin of Jake's form may be framed — nothing else. */
const ghlOrigin = (() => {
  try {
    const u = process.env.NEXT_PUBLIC_GHL_FORM_URL
    return u ? new URL(u).origin : ''
  } catch {
    return ''
  }
})()

/* ── CSP BUILDER ────────────────────────────────────────────────────────────
   Extracted from applyHeaders so the SAME string can be put on the request
   (where Next reads the nonce) and the response (where the browser enforces
   it). Building it twice from one nonce would also work, but a single source
   means the two can never drift apart after a future edit.
   ───────────────────────────────────────────────────────────────────────── */
function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'

  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: blob: https://*.supabase.co https://*.b-cdn.net`,
    `media-src 'self' blob: https://*.b-cdn.net https://iframe.mediadelivery.net`,
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.b-cdn.net`,
    `frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com https://iframe.mediadelivery.net${ghlOrigin ? ' ' + ghlOrigin : ''}`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ')
}

export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const csp = buildCsp(nonce)

  /* Next extracts the nonce from the REQUEST's CSP header to stamp its own
     inline bootstrap scripts. Response-only = hydration blocked wholesale. */
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('content-security-policy', csp)
  requestHeaders.set('x-nonce', nonce)

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          /* MUST re-pass requestHeaders. `{ request }` here would rebuild the
             response WITHOUT the CSP header, so any request that refreshes a
             Supabase token would silently lose the nonce and break hydration
             again — only for signed-in users, which is the worst way to find a
             bug. */
          response = NextResponse.next({ request: { headers: requestHeaders } })
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Signed out on a gated route → sign-in page, remembering where they wanted
  // to go so /auth/callback can return them there.
  if (!user && PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return applyHeaders(NextResponse.redirect(url), nonce, csp)
  }

  // Signed in on /login or /signup → straight to the dashboard. `next` is
  // deliberately NOT honoured here: it is an unvalidated query parameter, and
  // safeNext() in /auth/callback is where that check belongs.
  if (user && AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return applyHeaders(NextResponse.redirect(url), nonce, csp)
  }

  return applyHeaders(response, nonce, csp)
}

function applyHeaders(response: NextResponse, nonce: string, csp: string) {
  const isDev = process.env.NODE_ENV === 'development'

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
    headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload'
  }

  Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v))
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|830|event|thanks|go/|api/webhooks|.*\\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$).*)',
  ],
}