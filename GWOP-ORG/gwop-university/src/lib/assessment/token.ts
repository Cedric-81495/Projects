import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '@/lib/env'

/**
 * PROOF THAT THIS BROWSER JUST CREATED THIS LEAD.
 *
 * Why this exists at all: /api/assessment writes answers against a lead id. If
 * the browser simply sent a raw id, anyone could post answers onto anybody
 * else's record — and this endpoint sits behind a QR code printed on a card and
 * handed to several hundred strangers. Enumerable ids are not the risk; the
 * risk is that the id is visible in the page at all.
 *
 * So /api/lead mints a token bound to the lead it just created, and the
 * assessment endpoint accepts nothing else.
 *
 * Deliberately not a session, a cookie or a JWT library. A signed string with an
 * expiry is the entire requirement, and the booth is not the place to discover
 * that a dependency behaves differently under load.
 *
 * Format: <leadId>.<expiryMs>.<signature>
 */

const TTL_MS = 60 * 60 * 1000 // An hour. The assessment takes ninety seconds;
                              // the rest is slack for a phone locking, a
                              // conversation, or someone wandering off and back.

/* Falls back to CRON_SECRET, which is already required and already 32+ chars.
   A dedicated secret is better hygiene and is worth setting — but not at the
   cost of the flow failing to boot because one variable did not make it into
   Vercel before the event. */
const SECRET = env.ASSESSMENT_TOKEN_SECRET ?? env.CRON_SECRET

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('base64url')
}

export function mintAssessmentToken(leadId: string): string {
  const expiry = Date.now() + TTL_MS
  const payload = `${leadId}.${expiry}`
  return `${payload}.${sign(payload)}`
}

/**
 * Returns the lead id, or null for anything that fails.
 *
 * Never throws and never explains which check failed. A caller that
 * distinguishes "bad signature" from "expired" hands an attacker a tool; the
 * attendee-facing message is the same either way.
 */
export function readAssessmentToken(token: string): string | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [leadId, expiryRaw, signature] = parts
  const expected = sign(`${leadId}.${expiryRaw}`)

  /* Constant-time. A plain === leaks how much of the signature was correct
     through timing, and the whole point of signing is defeated by comparing
     carelessly. */
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  const expiry = Number(expiryRaw)
  if (!Number.isFinite(expiry) || Date.now() > expiry) return null

  return leadId
}
