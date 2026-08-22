import 'server-only'
import { z } from 'zod'

// Re-exported for convenience on the server. The definition lives in
// env.public.ts, which has no `server-only` guard so client components can
// import it directly.
export { publicEnv } from './env.public'

/**
 * Environment contract.
 *
 * Parsed once at module load. If a required secret is missing the process
 * refuses to boot — which is what you want, because the alternative is a
 * deploy that looks healthy and silently fails to grant anyone access at 2pm
 * on event day.
 *
 * NOTHING here is exported to the client except the NEXT_PUBLIC_* block at the
 * bottom, which is deliberately a separate object so a careless import of
 * `env` from a client component is a build error, not a leaked service key.
 */

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SUPABASE_JWT_SECRET: z.string().min(20).optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  STRIPE_MODE: z.enum(['test', 'live']).default('test'),

  // Rate limiting (Upstash). Optional: falls back to the Postgres limiter.
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(10).optional(),

  // Bot protection
  TURNSTILE_SECRET_KEY: z.string().min(10).optional(),

  // Bunny Stream — course video (§14). The security key SIGNS playback tokens.
  BUNNY_LIBRARY_ID: z.string().min(1),
  BUNNY_API_KEY: z.string().min(10),
  BUNNY_TOKEN_SECURITY_KEY: z.string().min(10),
  BUNNY_CDN_HOSTNAME: z.string().min(3),
  BUNNY_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),

  /* GoHighLevel inbound webhook. SERVER ONLY — never NEXT_PUBLIC.

     This is an unauthenticated write endpoint into the client's CRM. In client
     JavaScript it would be a public form anyone could flood with fake contacts.

     Optional so the whole flow ships and is testable before Jake supplies the
     URL: lib/ghl/sync.ts no-ops without it, leads accumulate as 'pending', and
     the cron drains them the moment it is configured.

     SUPERSEDES the embed-only note that stood here. Felicia approved the
     write-first + forward design on 2026-08-18. See ARCHITECTURE.md §14.1. */
  GHL_WEBHOOK_URL: z.string().url().optional(),

  // Scheduled jobs
  CRON_SECRET: z.string().min(32),

  /* Signs the short-lived token that lets a browser attach assessment answers
     to the lead it just created. SERVER ONLY.

     Falls back to CRON_SECRET rather than being required, so the assessment
     flow runs on every existing deployment without a new variable having to
     reach Vercel first — one less thing to be missing at 9am on the 30th. Set
     it properly in production; rotating it only invalidates in-flight tokens,
     which expire in an hour anyway. */
  ASSESSMENT_TOKEN_SECRET: z.string().min(32).optional(),

  // Storage
  MODULE_BUCKET: z.string().default('course-materials'),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
})


function parse<T extends z.ZodTypeAny>(schema: T, source: unknown, label: string): z.infer<T> {
  const result = schema.safeParse(source)
  if (!result.success) {
    const missing = result.error.issues.map((i) => `  · ${i.path.join('.')}: ${i.message}`)
    throw new Error(`Invalid ${label} environment:\n${missing.join('\n')}`)
  }
  return result.data
}

export const env = parse(serverSchema, process.env, 'server')


export const isProduction = env.NODE_ENV === 'production'
