import { z } from 'zod'

/**
 * Client-safe environment.
 *
 * Deliberately a SEPARATE FILE from `env.ts`, which carries `import
 * 'server-only'`. Client components need the publishable keys, and importing
 * them from the server module drags the whole server schema — and therefore the
 * service-role and Stripe secret declarations — toward the browser bundle.
 * Next refuses to build in that case, which is the correct outcome and is how
 * this split was found.
 *
 * Values must be referenced as full `process.env.NEXT_PUBLIC_X` literals below.
 * Next inlines them at build time by textual substitution; a computed lookup
 * like process.env[key] silently becomes undefined in the browser.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().default('http://localhost:3000/ingest'),
})

const parsed = clientSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
})

if (!parsed.success) {
  throw new Error(
    'Invalid public environment:\n' +
      parsed.error.issues.map((i) => `  · ${i.path.join('.')}: ${i.message}`).join('\n'),
  )
}

export const publicEnv = parsed.data
