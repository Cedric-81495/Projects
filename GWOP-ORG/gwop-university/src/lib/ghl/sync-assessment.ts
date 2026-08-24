import 'server-only'
import { env } from '@/lib/env'
import { admin } from '@/lib/supabase/admin'
import { logger } from '@/lib/observability/logger'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Forward a completed assessment to GoHighLevel's second inbound webhook.
 *
 * Jake supplied this URL on 2026-08-25, choosing the two-webhook approach.
 *
 * WHY TWO WEBHOOKS AND NOT ONE PAYLOAD
 *
 * Contact details are captured BEFORE the seven questions, so someone who
 * abandons partway is still a lead. That means the contact reaches Jake about a
 * minute before the answers exist, and a single delivery cannot carry both.
 *
 * The consequence for his side, which he has accepted: a contact is created and
 * then updated shortly after. Anything triggering on contact creation must not
 * assume these fields are populated.
 *
 * WHAT IS AND IS NOT SENT
 *
 * Only COMPLETED assessments. A partial one has not been submitted — the
 * attendee never confirmed those answers on the review screen, so sending them
 * would be reporting something they did not agree to. Those people still reach
 * Jake as contacts via the lead webhook; they simply arrive without assessment
 * fields, which is the honest representation of what happened.
 *
 * DESIGN NOTES
 *
 * · No-ops when the URL is unset, exactly like the lead sync. The flow ships
 *   and is testable without it; rows stay 'pending' and can be drained later.
 *
 * · SERVER env var only. Never NEXT_PUBLIC — it is an unauthenticated write
 *   endpoint into the client's CRM, and in browser JavaScript it would be a
 *   public form anyone could flood.
 *
 * · Never throws to the caller. The attendee has already seen their Blueprint;
 *   a forwarding problem is ours to retry, not theirs to see.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const MAX_ATTEMPTS = 5
const TIMEOUT_MS = 8_000

interface AssessmentRow {
  id: string
  lead_id: string
  financial_stage: string | null
  credit_range: string | null
  emergency_fund: string | null
  budget_status: string | null
  currently_building: string | null
  biggest_blocker: string | null
  blueprint_slug: string | null
  event_key: string
  status: string
  completed_at: string | null
  sync_attempts: number
  leads: { phone: string; email: string } | null
}

function buildPayload(a: AssessmentRow) {
  return {
    /* Flat keys, matching the lead payload convention. GHL maps top-level
       fields to custom fields directly; nesting means hand-written JSON paths
       for every field and a rename silently breaks the mapping. */

    /* The join key. Jake matches on this to find the contact he already has —
       not on email, because people mistype emails at booths. Phone travels too
       as a secondary match, already normalised to E.164 our side. */
    lead_id: a.lead_id,
    phone: a.leads?.phone ?? '',

    /* Machine values, not display labels. These are what his workflow
       conditions match on, and they come from the same config that renders the
       buttons — so the two cannot drift apart. */
    financial_stage: a.financial_stage ?? '',
    credit_range: a.credit_range ?? '',
    emergency_fund: a.emergency_fund ?? '',
    budget_status: a.budget_status ?? '',
    currently_building: a.currently_building ?? '',
    biggest_blocker: a.biggest_blocker ?? '',

    /* An unanswered question sends an empty value rather than being omitted.
       A missing key looks like a delivery problem; an empty one is a skip,
       which is a legitimate and expected answer. */

    /* Which roadmap they were actually shown. Lets his follow-up reference the
       right one rather than sending something generic. */
    blueprint_slug: a.blueprint_slug ?? '',

    assessment_status: a.status,
    event_key: a.event_key,
    completed_at: a.completed_at ?? '',
  }
}

export async function syncAssessmentToGhl(
  leadId: string,
): Promise<'synced' | 'pending' | 'failed'> {
  const url = env.GHL_ASSESSMENT_WEBHOOK_URL
  if (!url) {
    logger.info('assessment_sync_skipped_unconfigured', { leadId })
    return 'pending'
  }

  const { data: row, error } = await admin
    .from('assessments')
    .select(
      'id, lead_id, financial_stage, credit_range, emergency_fund, budget_status, ' +
        'currently_building, biggest_blocker, blueprint_slug, event_key, status, ' +
        'completed_at, sync_attempts, leads(phone, email)',
    )
    .eq('lead_id', leadId)
    .single<AssessmentRow>()

  if (error || !row) {
    logger.error('assessment_sync_row_missing', { leadId, message: error?.message })
    return 'failed'
  }

  /* Guard rather than assume. Called from the completion path today, but a
     future caller — a retry sweep, a manual replay — must not be able to push
     answers the attendee never confirmed. */
  if (row.status !== 'complete') {
    logger.info('assessment_sync_skipped_partial', { leadId })
    return 'pending'
  }

  const attempt = row.sync_attempts + 1

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        /* Same header as the lead sync, so Jake can correlate the two
           deliveries for one person without asking us to dig through a
           database. */
        'x-lead-id': row.lead_id,
      },
      body: JSON.stringify(buildPayload(row)),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`GHL responded ${res.status}: ${body.slice(0, 200)}`)
    }

    await admin
      .from('assessments')
      .update({
        sync_status: 'synced',
        synced_at: new Date().toISOString(),
        sync_attempts: attempt,
        last_error: null,
      })
      .eq('id', row.id)

    logger.info('assessment_synced', { leadId: row.lead_id, attempt })
    return 'synced'
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const exhausted = attempt >= MAX_ATTEMPTS

    await admin
      .from('assessments')
      .update({
        sync_status: exhausted ? 'failed' : 'pending',
        sync_attempts: attempt,
        last_error: message.slice(0, 500),
      })
      .eq('id', row.id)

    logger.error('assessment_sync_failed', {
      leadId: row.lead_id,
      attempt,
      exhausted,
      message,
    })
    return exhausted ? 'failed' : 'pending'
  }
}
