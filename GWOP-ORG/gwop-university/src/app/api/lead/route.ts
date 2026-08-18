import { z } from 'zod'
import { route } from '@/lib/http/handler'
import { ApiError } from '@/lib/http/errors'
import { clientIp } from '@/lib/http/rate-limit'
import { verifyTurnstile } from '@/lib/security/turnstile'
import { admin } from '@/lib/supabase/admin'
import { logger } from '@/lib/observability/logger'
import { INTERESTS, INTEREST_FALLBACK } from '@/config/integrations'
import { syncLeadToGhl } from '@/lib/ghl/sync'
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

const interestValues = INTERESTS.map((i) => i.value)

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

  interest: z.enum([...interestValues, INTEREST_FALLBACK] as [string, ...string[]])
    .optional()
    .default(INTEREST_FALLBACK),
  interest_tag: z.string().trim().max(120).optional().default(''),

  source: z.string().trim().max(60).optional().default(''),
  utm: z.record(z.string().max(200)).optional().default({}),

  /* Must be literally true. `.refine` rather than `z.literal(true)` so the
     message is the one the attendee should see. */
  consent_given: z.boolean().refine((v) => v, 'Please agree to receive messages'),
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
       Requires adding to RULES in lib/http/rate-limit.ts:
         lead: { limit: 60, windowSeconds: 300 }  */
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
        'verification_failed',
        'We could not verify that request. Reload the page and try again.',
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
        'lead_write_failed',
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
    void syncLeadToGhl(lead.id).catch((err: unknown) => {
      logger.warn('lead_sync_deferred', {
        requestId,
        leadId: lead.id,
        message: err instanceof Error ? err.message : String(err),
      })
    })

    return { id: lead.id }
  },
)
