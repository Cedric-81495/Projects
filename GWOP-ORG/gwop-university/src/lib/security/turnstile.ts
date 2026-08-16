import 'server-only'
import { env } from '@/lib/env'
import { logger } from '@/lib/observability/logger'

/**
 * Cloudflare Turnstile verification.
 *
 * Fails CLOSED when a secret is configured but Cloudflare is unreachable —
 * an unverifiable challenge is not a passed challenge. Returns true only when
 * Turnstile is deliberately not configured, so local development is not
 * blocked by a service the developer has not signed up for.
 */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return true // not configured — dev/local
  if (!token) return false

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip,
      }),
      signal: AbortSignal.timeout(5000),
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch (error) {
    logger.warn('turnstile_unreachable', {
      message: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}
