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
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  /**
   * Browser origin(s) permitted by CORS and used as the base for redirects and
   * links in outbound email.
   *
   * Accepts a comma-separated list so one deployment can serve the production
   * site alongside a preview or a local dev server, without introducing a second
   * variable name.
   */
  CLIENT_URL: z.string().default('http://localhost:5173'),
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

  if (data.JWT_SECRET === data.JWT_REFRESH_SECRET) {
    throw new Error(
      'JWT_SECRET and JWT_REFRESH_SECRET must differ. Reusing one secret for both ' +
        'token types lets a refresh token be replayed as an access token.',
    )
  }

  const clientUrls = data.CLIENT_URL.split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)

  if (clientUrls.length === 0) {
    throw new Error('CLIENT_URL must contain at least one origin.')
  }

  return {
    ...data,
    isProduction: data.NODE_ENV === 'production',
    clientUrls,
  }
}

export const env = loadCore()

/**
 * The canonical frontend origin — the first entry in CLIENT_URL.
 *
 * Used when the server must build an absolute link on its own (OAuth redirects,
 * transactional email) rather than reflecting a caller's origin.
 */
export const primaryClientUrl = env.clientUrls[0] as string

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

/**
 * Resolves a post-authentication redirect target against the allowlist.
 *
 * OAuth hands us a caller-supplied destination, which is a classic open-redirect
 * vector: an attacker who can choose the landing URL can bounce a freshly
 * authenticated user to a look-alike site. Only same-origin paths under a known
 * client URL are accepted; anything else falls back to the canonical origin.
 */
export function safeClientRedirect(target: string | undefined, fallbackPath = '/dashboard'): string {
  const base = primaryClientUrl

  if (!target) return `${base}${fallbackPath}`

  // A bare path is the common case and the only shape we mint ourselves.
  // Reject protocol-relative ("//evil.com") which a naive check would allow.
  if (target.startsWith('/') && !target.startsWith('//')) {
    return `${base}${target}`
  }

  try {
    const parsed = new URL(target)
    const origin = parsed.origin.replace(/\/$/, '')
    if (env.clientUrls.includes(origin)) return parsed.toString()
  } catch {
    // Not a parsable absolute URL — fall through to the safe default.
  }

  return `${base}${fallbackPath}`
}
