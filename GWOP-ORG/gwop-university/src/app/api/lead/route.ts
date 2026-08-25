import { z } from 'zod'
import { route } from '@/lib/http/handler'
import { ApiError } from '@/lib/http/errors'
import { clientIp } from '@/lib/http/rate-limit'
import { verifyTurnstile } from '@/lib/security/turnstile'
import { admin } from '@/lib/supabase/admin'
import { logger } from '@/lib/observability/logger'
import { INTERESTS, INTEREST_FALLBACK } from '@/config/integrations'
import { syncLeadToGhl } from '@/lib/ghl/sync'
import { mintAssessmentToken } from '@/lib/assessment/token'
import { waitUntil } from '@vercel/functions'
import parsePhoneNumber from 'libphonenumber-js'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * POST /api/lead — event signup capture.
 *
 * Felicia approved this shape on Aug 18: write server-side first, forward to
 * GHL with retries, GHL stays the operational CRM.
 *
 * ORDER OF OPERATIONS IS THE WHOLE DESIGN:
 *   1. Turnstile     — before anything that costs money or writes
 *   2. Rate limit    — backstop, generous (see note below)
 *   3. Validate      — reject before touching the database
 *   4. WRITE         — the attendee is done the moment this commits
 *   5. Forward       — best effort; failure does not fail the request
 *
 * Step 5 not blocking step 4 is the point. On congested venue cellular a slow
 * GHL round trip would otherwise leave someone staring at a spinner at a booth
 * with staff waiting. They get their confirmation from our commit; GHL catches
 * up in the background or the cron picks it up.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/* A Set, not a z.enum. z.enum needs a literal tuple and `.map()` returns a
   mutable array, so the cast that would bridge them is unverifiable — that was
   the build failure. This is better behaviour anyway: see the transform below. */
const allowedInterests = new Set<string>([
  ...INTERESTS.map((i) => i.value),
  INTEREST_FALLBACK,
])

const LeadBody = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(80),
  last_name: z.string().trim().max(80).optional().default(''),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(200),

  /* Accepted as typed, normalised below. A booth is not the place to lecture
     someone about formatting — take what they give and fix it if we can. */
  phone: z.string().trim().min(7, 'Enter a valid mobile number').max(30),
  /* Region hint for parsing. Defaults US: the event is US-based and the field
     is US-formatted, but this leaves the door open without a UI change. */
  phone_region: z.string().length(2).toUpperCase().optional().default('US'),

  /* Falls back rather than rejecting. A stale or mistyped query parameter must
     never cost a signup at the booth — an uncategorised lead is recoverable,
     a refused one is gone. Unknown, missing and wrong-case all land on
     `unspecified`, which is exactly the branch Jake needs a default for. */
  interest: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && allowedInterests.has(v) ? v : INTEREST_FALLBACK)),

  interest_tag: z.string().trim().max(120).optional().default(''),

  source: z.string().trim().max(60).optional().default(''),
  /* zod 4 requires BOTH key and value schemas here. A single argument compiles
     on zod 3 and fails on 4 — this project is on ^4.1.0. */
  utm: z.record(z.string(), z.string().max(200)).optional().default({}),

  /* Accepted either way. Jake, 2026-08-19: the checkbox is optional and
     unchecked by default, and the approved wording says "Consent is not a
     condition of purchase." Rejecting a declined lead would contradict the
     sentence beside the box and lose signups from people who want the
     Blueprint but not the texts. Jake's workflow branches on this value. */
  consent_given: z.boolean(),
  /* The exact sentence rendered next to the checkbox, sent back by the client
     so the stored record matches what was actually on screen. Wording will
     change; this row must remain evidence of what THIS person agreed to. */
  consent_text: z.string().trim().min(10).max(1000),

  turnstile_token: z.string().min(1, 'Verification failed. Reload and try again.'),
})

export const POST = route(
  {
    auth: 'public',
    /* NOT 'auth' (5 per 15 min). Every attendee at the booth shares one venue
       IP — on CGNAT or venue wifi they would rate-limit each other and the
       table would stop taking signups mid-event, silently.
       Turnstile is the real abuse control here; this is only a backstop.
       Requires `lead: { limit: 60, windowSeconds: 300 }` in RULES. */
    limit: 'lead',
    limitByUser: false,
    body: LeadBody,
  },
  async ({ req, body, requestId }) => {
    const ip = clientIp(req)

    // ── 1. Turnstile, before any write ────────────────────────────────────
    if (!(await verifyTurnstile(body.turnstile_token, ip))) {
      throw new ApiError(
        400,
        'validation_failed',
        /* Do NOT tell them to reload. This message is shown beneath a form the
           attendee has just filled in, and a reload discards every field —
           turning a recoverable hiccup into a retype at a table with a queue
           behind them. Tapping Send again re-runs the challenge and keeps the
           values. Also avoids "request", which means nothing to the reader. */
        'The security check did not complete. Wait a moment and tap Send again — nothing you typed has been lost.',
      )
    }

    // ── 2. Normalise the phone to E.164 ──────────────────────────────────
    const parsedPhone = parsePhoneNumber(body.phone, body.phone_region as never)
    if (!parsedPhone?.isValid()) {
      throw new ApiError(400, 'validation_failed', 'Enter a valid mobile number.')
    }
    const phone = parsedPhone.number // +15551234567

    // ── 3. Write. The attendee is done once this commits. ────────────────
    const { data: lead, error } = await admin
      .from('leads')
      .insert({
        first_name: body.first_name,
        last_name: body.last_name || null,
        email: body.email,
        phone,
        interest: body.interest,
        interest_tag: body.interest_tag || null,
        source: body.source || null,
        utm: body.utm,
        referer: req.headers.get('referer'),
        consent_given: body.consent_given,
        consent_text: body.consent_text,
        consent_ip: ip === '0.0.0.0' ? null : ip,
        user_agent: req.headers.get('user-agent'),
      })
      .select('id')
      .single()

    if (error || !lead) {
      /* Fail loudly. A signup we cannot store is the one case where the
         attendee must be told to try again — silently dropping it is exactly
         the failure mode this whole change exists to remove. */
      logger.error('lead_write_failed', { requestId, message: error?.message })
      throw new ApiError(
        503,
        'upstream_unavailable',
        'We could not save that just now. Please try again.',
      )
    }

    logger.info('lead_captured', {
      requestId,
      leadId: lead.id,
      interest: body.interest,
      source: body.source || null,
    })

    /* ── 4. Forward, best effort ───────────────────────────────────────────
       Deliberately not awaited into the response. A failure here leaves the
       row 'pending' and the retry cron collects it. No-ops until Jake's
       webhook URL is configured, so this ships before he replies. */
    /* waitUntil, NOT a bare `void`.

       On serverless the instance can be frozen the moment the response is
       returned, and any promise still in flight is simply discarded — no error,
       no log, no attempt. We caught this on 2026-08-25: a completed assessment
       showed sync_attempts = 0 with last_error NULL, because the forward never
       ran at all. It had appeared to work in testing only because the instance
       sometimes stayed warm long enough.

       waitUntil tells the platform to keep the instance alive until this
       settles, while still returning the response immediately. The attendee
       waits for nothing; the forward actually happens. */
    waitUntil(syncLeadToGhl(lead.id).catch((err: unknown) => {
      logger.warn('lead_sync_deferred', {
        requestId,
        leadId: lead.id,
        message: err instanceof Error ? err.message : String(err),
      })
    }))

    /* The token is what lets this browser attach assessment answers to the lead
       it just created. Minted here rather than derived client-side for the
       obvious reason: anything the client can construct, anyone can construct,
       and this endpoint is behind a QR code handed to several hundred people.
       See lib/assessment/token.ts. */
    return { id: lead.id, assessment_token: mintAssessmentToken(lead.id) }
  },
)