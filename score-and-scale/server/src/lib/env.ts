import 'dotenv/config'
import { z } from 'zod'

/**
 * Environment access is split into two tiers.
 *
 * Core config is validated once at boot: without a database or signing secrets
 * the process cannot serve a single authenticated request, so failing fast is
 * the correct behaviour.
 *
 * Optional integrations (Braintree, Supabase, Resend, Google) are validated
 * lazily by their own module on first use. A missing payment credential must
 * not stop the marketing site, auth, or the dashboard from working, so those
 * routes degrade to a 503 with an explicit error code instead of taking the
 * whole API down at startup.
 */

const coreSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
})

function loadCore() {
  const parsed = coreSchema.safeParse(process.env)

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid server environment configuration:\n${details}`)
  }

  const data = parsed.data

  if (data.JWT_ACCESS_SECRET === data.JWT_REFRESH_SECRET) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ. Reusing one secret for both ' +
        'token types lets a refresh token be replayed as an access token.',
    )
  }

  return {
    ...data,
    isProduction: data.NODE_ENV === 'production',
    /** Every browser origin permitted by CORS. */
    clientOrigins: data.CLIENT_ORIGIN.split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean),
  }
}

export const env = loadCore()

/** The canonical frontend origin, used when building links in outbound email. */
export const primaryClientOrigin = env.clientOrigins[0] ?? 'http://localhost:5173'

/**
 * Reads a group of optional integration variables, returning null when the
 * group is not configured. Callers surface that as a 503 rather than crashing.
 */
export function readOptionalGroup<const K extends readonly string[]>(
  keys: K,
): Record<K[number], string> | null {
  const out: Record<string, string> = {}

  for (const key of keys) {
    const value = process.env[key]
    if (!value) return null
    out[key] = value
  }

  return out as Record<K[number], string>
}
