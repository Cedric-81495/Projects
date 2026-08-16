import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { env } from '@/lib/env'
import { admin } from '@/lib/supabase/admin'
import { ApiError } from './errors'
import { logger } from '@/lib/observability/logger'

/**
 * Two-tier rate limiting.
 *
 *   Tier 1 — Upstash Redis, sliding window. Fast, distributed, accurate.
 *   Tier 2 — Postgres fixed window, used when Redis is unconfigured or down.
 *
 * The fallback exists because "Redis is unreachable" must not silently mean
 * "the API is now unlimited". Fail closed on the resource, not open.
 */

export type LimitName =
  | 'auth' // sign-in, sign-up, password reset — the expensive, abusable ones
  | 'read' // catalogue and progress reads
  | 'write' // progress writes
  | 'checkout' // Stripe session creation
  | 'playback' // signed playback URL minting

interface Rule {
  limit: number
  windowSeconds: number
}

/**
 * Tuned for a booth, not a benchmark. `read` is generous because a member area
 * on a slow phone re-fetches on every navigation; `auth` and `playback` are
 * tight because they cost money and mint credentials respectively.
 */
export const RULES: Record<LimitName, Rule> = {
  auth: { limit: 5, windowSeconds: 900 },
  read: { limit: 120, windowSeconds: 60 },
  write: { limit: 60, windowSeconds: 60 },
  checkout: { limit: 10, windowSeconds: 300 },
  playback: { limit: 30, windowSeconds: 300 },
}

const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })
    : null

const limiters = new Map<LimitName, Ratelimit>()

function limiterFor(name: LimitName): Ratelimit | null {
  if (!redis) return null
  let l = limiters.get(name)
  if (!l) {
    const rule = RULES[name]
    l = new Ratelimit({
      redis,
      analytics: true,
      prefix: `gwop:rl:${name}`,
      limiter: Ratelimit.slidingWindow(rule.limit, `${rule.windowSeconds} s`),
    })
    limiters.set(name, l)
  }
  return l
}

/**
 * Derives the client IP.
 *
 * Only the LEFT-most entry of x-forwarded-for is meaningful, and only because
 * Vercel rewrites that header at the edge. Behind any other proxy this must be
 * re-verified — a client can send whatever x-forwarded-for it likes.
 */
export function clientIp(req: Request): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '0.0.0.0'
  )
}

export interface LimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

async function check(name: LimitName, identifier: string): Promise<LimitResult> {
  const key = `${name}:${identifier}`
  const limiter = limiterFor(name)

  if (limiter) {
    try {
      const r = await limiter.limit(key)
      return { allowed: r.success, remaining: r.remaining, resetAt: new Date(r.reset) }
    } catch (error) {
      logger.warn('ratelimit_redis_unavailable', {
        name,
        message: error instanceof Error ? error.message : String(error),
      })
      // fall through to Postgres
    }
  }

  const rule = RULES[name]
  const { data, error } = await admin.rpc('rate_limit_hit', {
    p_key: key,
    p_limit: rule.limit,
    p_window_seconds: rule.windowSeconds,
  })

  if (error || !data?.[0]) {
    // Both tiers unavailable. Refuse rather than run unprotected.
    logger.error('ratelimit_unavailable', { name, message: error?.message })
    return { allowed: false, remaining: 0, resetAt: new Date(Date.now() + rule.windowSeconds * 1000) }
  }

  return {
    allowed: data[0].allowed,
    remaining: data[0].remaining,
    resetAt: new Date(data[0].reset_at),
  }
}

/**
 * Enforce a limit, throwing a 429 with Retry-After details when exceeded.
 *
 * Pass `identifier` explicitly for user-scoped limits (userId) — IP alone is
 * wrong on mobile carriers, where thousands of phones share one CGNAT address
 * and would rate-limit each other.
 */
export async function enforceLimit(
  name: LimitName,
  identifier: string,
): Promise<LimitResult> {
  const result = await check(name, identifier)
  if (!result.allowed) {
    const retryAfter = Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000))
    throw new ApiError(429, 'rate_limited', 'Too many requests. Wait a moment and try again.', {
      retryAfter,
    })
  }
  return result
}

export function limitHeaders(name: LimitName, r: LimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(RULES[name].limit),
    'X-RateLimit-Remaining': String(r.remaining),
    'X-RateLimit-Reset': String(Math.floor(r.resetAt.getTime() / 1000)),
  }
}
