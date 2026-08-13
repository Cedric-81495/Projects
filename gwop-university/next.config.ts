import type { NextConfig } from 'next'
import { GHL_FORM_URL } from './src/config/integrations'

/* ═══════════════════════════════════════════════════════════════════════════
   SECURITY HEADERS
   This site stores no data — Jake's GoHighLevel form is the system of record.
   What it *does* have is (a) a user-controllable URL param and (b) a
   third-party iframe. These headers constrain both.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Only the origin of Jake's form may be framed — nothing else. */
const ghlOrigin = (() => {
  try { return GHL_FORM_URL ? new URL(GHL_FORM_URL).origin : '' } catch { return '' }
})()

const csp = [
  "default-src 'self'",
  // Next injects inline bootstrap scripts; no third-party script origins allowed.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  `frame-src ${ghlOrigin || "'none'"}`.trim(),
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
