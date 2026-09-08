import type { NextConfig } from 'next'
import { GHL_FORM_URL, BOOKING_URL } from './src/config/integrations'

/* ═══════════════════════════════════════════════════════════════════════════
   SECURITY HEADERS

   ⚠ WHICH PAGES THIS FILE ACTUALLY GOVERNS — READ FIRST.

   There are two CSPs in this repo. src/middleware.ts also declares one, it
   runs later, and its header wins wherever it runs. The middleware matcher
   excludes: 830, event, thanks, go/, api/webhooks and static assets.

   So this file is the CSP for /830 and the QR redirect, and nowhere else.
   /blueprint, /app, /dashboard and everything else get the nonce CSP from
   middleware.

   The practical consequence, which has already cost this project time: adding
   an origin to only one of the two files produces no error and no feature. If
   something on /830 fails silently, check THIS list. If something on
   /blueprint fails silently, check middleware.ts.

   Adding an origin here is a security decision, not a formality. One line per
   origin, with a reason. If a script is not needed, it does not go in.
   Jake's AI chat widget is deliberately NOT rendered on /830 — CLAUDE.md §8.7
   keeps every third-party script off the acquisition surface. CSP cannot vary
   per route in this file, so that exclusion is enforced by not rendering the
   component there.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Only the origin of Jake's form may be framed — nothing else. */
const ghlOrigin = (() => {
  try { return GHL_FORM_URL ? new URL(GHL_FORM_URL).origin : '' } catch { return '' }
})()

/* ⚠ ADDED. The 1:1 booking widget was rendering only by luck: it happens to
   share the api.leadconnectorhq.com origin with Jake's form, so it inherited
   `ghlOrigin` above. The day he moves the form to a different host, booking
   breaks silently on a page nobody is watching, and the cause will not be
   anywhere near the symptom. Named explicitly so the two are independent. */
const bookingOrigin = (() => {
  try { return BOOKING_URL ? new URL(BOOKING_URL).origin : '' } catch { return '' }
})()

/* Cloudflare Turnstile. Required in BOTH script-src and frame-src: the loader
   is a script, and the widget itself renders in an iframe. Missing either one
   and the challenge never runs, so `cf-turnstile-response` is empty and
   /api/lead rejects every submission with a 422 — which looks like a form bug,
   not a header problem. */
const TURNSTILE = 'https://challenges.cloudflare.com'

/* Bunny Stream. The Blueprint teaser player.

   ⚠ THIS IS THE FIX FOR THE TEASER VIDEO ON /830.
   Two things were wrong, and either alone was enough to leave a dead box on
   the page with only a console violation to show for it:

     1. iframe.mediadelivery.net was in the middleware CSP but not here — and
        /830 is exactly the route middleware does not run on.
     2. This file declared NO media-src at all, so media fell back to
        default-src 'self' and the stream was refused even once the frame was
        allowed.

   The middleware CSP already has both. This brings /830 level with it.
   To switch the teaser on: upload to Bunny, put the ID in
   config/identityiq.ts `video.bunnyId`, set `video.pending = false`, then
   watch it once on a phone on cellular. */
const BUNNY_FRAME = 'https://iframe.mediadelivery.net'
const BUNNY_CDN = 'https://*.b-cdn.net'

/* Jake's GHL chat widget. Loader, assets and the socket it opens back to
   LeadConnector. Added 2026-08-20. Scoped as narrowly as the widget allows,
   and NOT permitted on /830. */
const GHL_CHAT = [
  'https://widgets.leadconnectorhq.com',
  'https://services.leadconnectorhq.com',
  'https://backend.leadconnectorhq.com',
]

const csp = [
  "default-src 'self'",
  // Next injects inline bootstrap scripts. Turnstile is the only third-party origin.
  `script-src 'self' 'unsafe-inline' ${TURNSTILE} ${GHL_CHAT[0]}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src 'self' data: blob: ${BUNNY_CDN} ${GHL_CHAT[0]}`,
  `connect-src 'self' ${BUNNY_CDN} ${GHL_CHAT.join(' ')} wss://backend.leadconnectorhq.com`,
  /* ⚠ ADDED — see BUNNY_FRAME above. Without this line the teaser is blocked
     on this route no matter what middleware.ts says. */
  `media-src 'self' blob: ${BUNNY_CDN} ${BUNNY_FRAME}`,
  `frame-src ${[ghlOrigin, bookingOrigin, TURNSTILE, BUNNY_FRAME, GHL_CHAT[0]]
    .filter(Boolean).join(' ')}`,
  "form-action 'self'",
  "frame-ancestors 'none'",   // nobody may embed our pages (clickjacking)
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

const nextConfig: NextConfig = {
  poweredByHeader: false,

  /* ── /blueprint → /830 ────────────────────────────────────────────────────
     There is ONE funnel page and it is /830. This alias exists so ads, print
     and anything spoken out loud can use a URL that means something, without
     creating a second page to keep in sync.

     A redirect rather than a duplicate route, deliberately. Two routes
     rendering the same funnel would split analytics, duplicate the canonical,
     and guarantee that one of them eventually falls behind the other on copy.
     308 is permanent and method-preserving.

     If a dated campaign ever needs its own page, it gets its own route with
     its own copy — not a fork of this one. That was the whole lesson of the
     8/30 de-eventing. */
  async redirects() {
    return [
      { source: '/blueprint', destination: '/830', permanent: true },
      { source: '/funnel', destination: '/830', permanent: true },
    ]
  },

  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'Content-Security-Policy', value: csp },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        // we need none of these — deny them so a future third-party script can't ask
        { key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
      ],
    }]
  },
}
export default nextConfig
