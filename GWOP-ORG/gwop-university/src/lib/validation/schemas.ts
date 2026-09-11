import { z } from 'zod'
import { parsePhoneNumberFromString } from 'libphonenumber-js'

/**
 * Validation lives here and nowhere else.
 *
 * These schemas are exported as the package `@gwop/contracts` so the React
 * Native app imports the SAME objects. Two implementations of "what a valid
 * phone number is" always drift, and the drift shows up as records the backend
 * accepts from one client and rejects from the other.
 */

/** Normalises to E.164, defaulting to US since the audience is US-based. */
export const phoneE164 = z
  .string()
  .trim()
  .min(7)
  .max(30)
  .transform((raw, ctx) => {
    const parsed = parsePhoneNumberFromString(raw, 'US')
    if (!parsed?.isValid()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid phone number.' })
      return z.NEVER
    }
    return parsed.number // +15551234567
  })

export const email = z.string().trim().toLowerCase().email('Enter a valid email address.').max(200)

export const uuid = z.string().uuid('Malformed identifier.')

export const levelNumber = z.coerce.number().int().min(1).max(4)

/** Strips control characters and collapses whitespace on free-text fields. */
export const safeText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    // eslint-disable-next-line no-control-regex
    .transform((s) => s.replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' '))

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export const updateProfileSchema = z
  .object({
    full_name: safeText(120).optional(),
    phone: phoneE164.optional(),
    marketing_opt_in: z.boolean().optional(),
  })
  .strict() // reject unknown keys outright — no mass assignment
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update.')

// ---------------------------------------------------------------------------
// Progress — written by both clients
// ---------------------------------------------------------------------------
export const upsertProgressSchema = z
  .object({
    lesson_id: uuid,
    position_sec: z.number().int().min(0).max(86_400),
    watched_sec: z.number().int().min(0).max(86_400).optional(),
    status: z.enum(['not_started', 'in_progress', 'completed']),
    device: z.enum(['web', 'ios', 'android']).default('web'),
  })
  .strict()

// ---------------------------------------------------------------------------
// Checkout — note what is absent: no price, no amount, no currency.
// The client picks a product; the server decides what it costs.
// ---------------------------------------------------------------------------
export const createCheckoutSchema = z
  .object({
    plan_sku: z
      .string()
      .trim()
      .regex(/^[A-Z0-9]+(-[A-Z0-9]+)*$/, 'Unknown plan.')
      .max(60),
    /* ⚠ idempotency_key REMOVED FROM THE CLIENT CONTRACT — 2026-09-10.

       It was a uuid the browser generated per click, which meant a double-tap
       or a refresh produced a different key each time and every duplicate-charge
       protection was bypassed. The key is now derived server-side in
       lib/stripe/checkout.ts from (user, plan, attempt).

       Deliberately NOT kept as an optional field: an optional key the client
       may still send is a key the client can use to force a second payment
       row, which is the exact hole being closed. */
    /** Where to land afterwards. Validated against an allowlist in the route. */
    return_path: z
      .string()
      .startsWith('/', 'Relative paths only.')
      .max(200)
      .default('/dashboard'),

    /* ── THE NO-REFUND ACKNOWLEDGEMENT ──────────────────────────────────────
       ⚠ literal(true), NOT boolean(). A `boolean` would accept `false` and
       silently create a purchase with no acknowledgement — exactly the record
       we would need in a dispute and would not have. This makes an untickeded
       box a 422 at the schema, before any Stripe call.

       ⚠ THE VERSION IS SENT BY THE CLIENT AND RE-CHECKED SERVER-SIDE. It is
       here so the server knows which wording the browser actually rendered —
       if a stale tab shows v1 while the server has moved to v2, we would
       otherwise record agreement to a sentence they never saw. The route
       rejects a mismatch rather than trusting either side. */
    /* ⚠ `message`, not `errorMap`. Zod 4 removed errorMap in favour of a plain
       message or an `error` function — the project is on zod ^4.1.0. */
    ack_accepted: z.literal(true, {
      message: 'You must acknowledge the terms to continue.',
    }),
    ack_version: z.string().trim().min(1).max(40),
  })
  .strict()

// ---------------------------------------------------------------------------
// NOTE: there is deliberately no lead schema here.
// Event leads are captured by Jake's embedded GoHighLevel form and live only
// in GHL (§4, §28). If a task asks for a lead endpoint, escalate rather than
// add one — see ARCHITECTURE.md §14.1.
// ---------------------------------------------------------------------------

export const listLessonsQuery = z
  .object({
    module: uuid.optional(),
    level: levelNumber.optional(),
    cursor: uuid.optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict()

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type UpsertProgressInput = z.infer<typeof upsertProgressSchema>
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>