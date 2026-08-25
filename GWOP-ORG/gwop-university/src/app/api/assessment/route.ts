import { z } from 'zod'
import { route } from '@/lib/http/handler'
import { ApiError } from '@/lib/http/errors'
import { admin } from '@/lib/supabase/admin'
import { logger } from '@/lib/observability/logger'
import { syncAssessmentToGhl } from '@/lib/ghl/sync-assessment'
import { waitUntil } from '@vercel/functions'
import { readAssessmentToken } from '@/lib/assessment/token'
import { selectBlueprint } from '@/config/blueprint'
import {
  ALLOWED_ANSWERS,
  ASSESSMENT_FIELDS,
  EVENT_KEY,
  type AssessmentField,
} from '@/config/assessment'
import { INTERESTS, INTEREST_FALLBACK } from '@/config/integrations'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * POST /api/assessment — the seven-question needs assessment.
 *
 * CALLED ONCE PER ANSWER, not once at the end. That is the design, and it is
 * the reason someone can lock their phone at question five, reopen it, and
 * carry on. A single submission at the end would mean a dropped connection
 * halfway costs every answer they gave.
 *
 * It also means a partial row is normal. Contact is already captured by
 * /api/lead before the first question appears, so somebody who walks away at
 * Q4 is a lead we can still follow up, with four answers attached, rather than
 * a scan that went nowhere.
 *
 * AUTHORISATION is the signed token from /api/lead, never a raw lead id. This
 * endpoint is reachable from a code printed on a card and handed to strangers.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/* Answers validated against the same config that renders the buttons, so the
   two cannot disagree. Unknown field names are rejected outright rather than
   silently dropped — a typo in a field name should be loud in testing, not a
   column that quietly stays null for four hundred people. */
const AnswerBody = z.object({
  token: z.string().min(10),
  answers: z.record(z.string(), z.string().max(40)),
  /* Q1 lives on `leads`, not here, because it is the interest field Jake's
     workflow matches on. But an attendee correcting a mis-tap should be able to
     reach it like any other answer, so this endpoint accepts it and updates the
     lead. Sent only when they actually change it. */
  interest: z.string().trim().max(60).optional(),
  /* Set when Q7 is answered. The client says so rather than us inferring it
     from a full row: someone may legitimately skip a question, and 'complete'
     should mean "reached the end", not "left nothing blank". */
  complete: z.boolean().optional().default(false),
})

export const POST = route(
  {
    auth: 'public',
    /* Same generous shape as the lead limit and for the same reason: every
       attendee at the booth shares one venue IP. This route is called six or
       seven times per person, so it needs headroom the lead route does not.
       Reuses the 'lead' rule rather than adding one that would also have to be
       tuned — the failure mode of a strict limit here is the assessment
       silently refusing to save halfway through, which nobody would notice
       until the data came back thin. */
    limit: 'lead',
    limitByUser: false,
    body: AnswerBody,
  },
  async ({ body, requestId }) => {
    const leadId = readAssessmentToken(body.token)
    if (!leadId) {
      /* Deliberately vague, and deliberately not a 401 — there is no login here
         to retry. The attendee-facing consequence is that answers stop saving,
         so the message tells staff what to do rather than describing a token. */
      throw new ApiError(
        400,
        'validation_failed',
        'This session has expired. Ask a staff member and they will start you again.',
      )
    }

    // ── Keep only answers that were actually on screen ────────────────────
    const clean: Partial<Record<AssessmentField, string>> = {}
    for (const [field, value] of Object.entries(body.answers)) {
      if (!ASSESSMENT_FIELDS.includes(field as AssessmentField)) {
        throw new ApiError(400, 'validation_failed', 'Unrecognised answer.')
      }
      const allowed = ALLOWED_ANSWERS[field as AssessmentField]
      if (!allowed.has(value)) {
        throw new ApiError(400, 'validation_failed', 'Unrecognised answer.')
      }
      clean[field as AssessmentField] = value
    }

    /* Q1 lives on the lead, so the blueprint needs both sides. Read it here
       rather than trusting the client to send back what it was given. */
    const { data: lead, error: leadErr } = await admin
      .from('leads')
      .select('id, interest')
      .eq('id', leadId)
      .single<{ id: string; interest: string | null }>()

    if (leadErr || !lead) {
      logger.error('assessment_lead_missing', { requestId, leadId, message: leadErr?.message })
      throw new ApiError(404, 'not_found', 'We could not find that signup. Please start again.')
    }

    /* ── Q1, if they changed it ───────────────────────────────────────────
       Written to `leads`, not `assessments`, because that column is what Jake's
       workflow matches on and there must be exactly one source of truth for it.

       Validated against the same INTERESTS list the buttons render from. A
       value that was never on screen is dropped rather than rejected: this
       arrives mid-flow at a booth, and refusing the whole request over a stale
       option would cost the remaining answers too. */
    let interest = lead.interest
    if (body.interest && body.interest !== lead.interest) {
      const known = INTERESTS.find((i) => i.value === body.interest)
      const value = known?.value ?? (body.interest === INTEREST_FALLBACK ? INTEREST_FALLBACK : null)

      if (value) {
        const { error: leadUpdateError } = await admin
          .from('leads')
          .update({ interest: value, interest_tag: known?.tag ?? null })
          .eq('id', leadId)

        if (leadUpdateError) {
          /* Not fatal. Their assessment answers still save and they still get a
             roadmap — it just resolves against the interest we already had. */
          logger.warn('assessment_interest_update_failed', {
            requestId,
            leadId,
            message: leadUpdateError.message,
          })
        } else {
          interest = value
        }
      }
    }

    /* Read the row so a partial update can be merged before deciding the
       blueprint. Without this, answering Q7 first would resolve against an
       empty stage rather than the one they already gave. */
    const { data: existing } = await admin
      .from('assessments')
      .select('financial_stage, status')
      .eq('lead_id', leadId)
      .maybeSingle<{ financial_stage: string | null; status: string }>()

    /* ── SUBMITTED MEANS SUBMITTED ────────────────────────────────────────
       The attendee reviews every answer and submits deliberately, and after
       that the record is closed. Enforced here rather than only by hiding the
       buttons, because the client is a page anyone in the room can reach from a
       printed code — and because a record that can change after the fact is not
       evidence of what someone actually told us.

       It also protects the follow-up: once this forwards to GHL, a later edit
       would mean the roadmap someone was sent no longer matches the row. */
    if (existing?.status === 'complete') {
      throw new ApiError(
        409,
        'conflict',
        'Your answers are already submitted. Ask a staff member if something needs changing.',
      )
    }

    const financialStage = clean.financial_stage ?? existing?.financial_stage ?? null

    const blueprintSlug = selectBlueprint({
      interest,
      financial_stage: financialStage,
    })

    /* Upsert on lead_id. Idempotent by construction: a retry after a dropped
       connection rewrites the same answer rather than creating a second row,
       which matters because the client retries automatically on a bad signal. */
    const { error } = await admin
      .from('assessments')
      .upsert(
        {
          lead_id: leadId,
          ...clean,
          blueprint_slug: blueprintSlug,
          event_key: EVENT_KEY,
          status: body.complete ? 'complete' : 'partial',
          ...(body.complete ? { completed_at: new Date().toISOString() } : {}),
        },
        { onConflict: 'lead_id' },
      )

    if (error) {
      logger.error('assessment_write_failed', { requestId, leadId, message: error.message })
      throw new ApiError(
        503,
        'upstream_unavailable',
        'We could not save that just now. Tap again in a moment.',
      )
    }

    if (body.complete) {
      logger.info('assessment_completed', { requestId, leadId, blueprintSlug })
      /* Jake chose the two-webhook approach on 2026-08-25, so the answers
         forward here — separately from the contact, which reached him about a
         minute ago when the form was submitted.

         Not awaited, exactly like the lead forward. The attendee is already
         looking at their Blueprint; a slow or failing CRM must never be
         something they wait on. Failures are recorded on the row and retried
         rather than surfaced. */
      /* waitUntil, not a bare `void` — see the same note in /api/lead. A
         discarded promise here means the answers silently never reach Jake,
         with no error anywhere to say so. */
      waitUntil(syncAssessmentToGhl(leadId).catch((err: unknown) => {
        logger.error('assessment_sync_threw', {
          requestId,
          leadId,
          message: err instanceof Error ? err.message : String(err),
        })
      }))
    }

    return { blueprint: blueprintSlug }
  },
)
