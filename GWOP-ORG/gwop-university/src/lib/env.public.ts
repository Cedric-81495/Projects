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

  /* Which capture path /830 renders.

       'native' — our own form → POST /api/lead → Supabase → GHL webhook.
                  Felicia approved 2026-08-18; Jake confirmed 08-19 that his
                  GHL form is no longer needed and we should redirect to our
                  own thank-you page directly.
       'iframe' — Jake's embedded GHL form. Retained as the fallback Felicia
                  asked to keep live until the native path is signed off.

     An env var deliberately, not a code branch: on event day a revert has to
     take thirty seconds, not a redeploy. */
  NEXT_PUBLIC_LEAD_CAPTURE_MODE: z.enum(['native', 'iframe']).default('native'),
})

const parsed = clientSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  NEXT_PUBLIC_LEAD_CAPTURE_MODE: process.env.NEXT_PUBLIC_LEAD_CAPTURE_MODE,
})

if (!parsed.success) {
  throw new Error(
    'Invalid public environment:\n' +
      parsed.error.issues.map((i) => `  · ${i.path.join('.')}: ${i.message}`).join('\n'),
  )
}

export const publicEnv = parsed.data
