import type { NextConfig } from 'next'
import { GHL_FORM_URL } from './src/config/integrations'

/* ═══════════════════════════════════════════════════════════════════════════
   SECURITY HEADERS
   Updated 2026-08-19. The earlier note here said this site stores no data — that
   stopped being true when Felicia approved write-first capture on Aug 18. The
   page now runs a Turnstile challenge and POSTs to /api/lead, so the allow-list
   below has to name Turnstile explicitly.

   Adding an origin here is a security decision, not a formality. One line per
   origin, with a reason. If a script is not needed, it does not go in.
   Jake's AI chat widget is deliberately NOT allowed — CLAUDE.md §8.7 keeps
   every third-party script off /830 before Aug 27.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Only the origin of Jake's form may be framed — nothing else. */
const ghlOrigin = (() => {
  try { return GHL_FORM_URL ? new URL(GHL_FORM_URL).origin : '' } catch { return '' }
})()

/* Cloudflare Turnstile. Required in BOTH script-src and frame-src: the loader is
   a script, and the widget itself renders in an iframe. Missing either one and
   the challenge never runs, so `cf-turnstile-response` is empty and /api/lead
   rejects every submission with a 422 — which looks like a form bug, not a
   header problem. */
const TURNSTILE = 'https://challenges.cloudflare.com'

/* Jake's GHL chat widget. Loader, assets and the socket it opens back to
   LeadConnector. Added 2026-08-20.
   Adding a third-party origin here is a security decision: this grants the
   script the ability to run on our pages. It is scoped as narrowly as the widget
   allows, and it is NOT permitted on /830 — that exclusion is enforced by not
   rendering the component there, since CSP cannot vary per route in this config.
   If the bubble does not appear, check the console for a CSP violation naming a
   host that is not in this list. */
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
  `img-src 'self' data: blob: ${GHL_CHAT[0]}`,
  `connect-src 'self' ${GHL_CHAT.join(' ')} wss://backend.leadconnectorhq.com`,
  `frame-src ${[ghlOrigin, TURNSTILE, GHL_CHAT[0]].filter(Boolean).join(' ')}`,
  "form-action 'self'",
  "frame-ancestors 'none'",   // nobody may embed our pages (clickjacking)
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

const nextConfig: NextConfig = {
  poweredByHeader: false,
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