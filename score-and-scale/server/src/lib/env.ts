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

/**
 * Trims every value before validation.
 *
 * Copying credentials between a dashboard and a file very easily carries a
 * trailing space, and an untrimmed secret fails authentication with an error
 * from the provider that says nothing about whitespace. A value that is only
 * whitespace is treated as absent rather than as a valid empty string.
 */
function trimmedEnv(): Record<string, string> {
  const out: Record<string, string> = {}

  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value !== 'string') continue
    const trimmed = value.trim()
    if (trimmed) out[key] = trimmed
  }

  return out
}

function loadCore() {
  const parsed = coreSchema.safeParse(trimmedEnv())

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

  const isProduction = data.NODE_ENV === 'production'

  /**
   * Outside production, the local dev server is added to the allowlist
   * automatically.
   *
   * CLIENT_URL in a deployed environment names only the deployed site, so
   * running the API locally against that same value would have CORS reject
   * every request from Vite. Appending the dev origins here means one variable
   * works in both places, and it can never widen the allowlist in production.
   */
  const devOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']
  const allOrigins = isProduction
    ? clientUrls
    : [...clientUrls, ...devOrigins.filter((origin) => !clientUrls.includes(origin))]

  return {
    ...data,
    isProduction,
    clientUrls: allOrigins,
    /** Only the configured origins — used for redirects, never widened by dev. */
    canonicalClientUrls: clientUrls,
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
    // Trimmed for the same reason as the core config: a pasted credential very
    // often carries a trailing space, and providers reject it with an error that
    // never mentions whitespace.
    const value = process.env[key]?.trim()
    if (!value) return null
    out[key] = value
  }

  return out as Record<K[number], string>
}

/** Single trimmed optional value, with an optional default. */
export function readOptional(key: string, fallback?: string): string | undefined {
  return process.env[key]?.trim() || fallback
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
