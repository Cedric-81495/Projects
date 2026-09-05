import 'server-only'
import { env } from '@/lib/env'
import { admin } from '@/lib/supabase/admin'
import { logger } from '@/lib/observability/logger'
import { labelFor } from '@/config/assessment'

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

/* Slug → a short, scannable name for the roadmap.

   ⚠ NOT THE HEADLINE. This sent `headline` until 2026-09-04 — "Start with a
   clear picture" for `foundation`. That reads as marketing copy in an internal
   notification, where what you want at a glance is which roadmap they landed
   on. Jake asked for "Foundation" instead, and he is right: the headline
   belongs on the Blueprint screen the attendee reads, not in an alert.

   Derived from the slug rather than added as a tenth content field, so a new
   blueprint gets a name automatically and there is nothing to keep in sync:

     foundation            → Foundation
     credit-early          → Credit — Early
     credit-established    → Credit — Established
     funding-early         → Funding — Early
     wealth-established    → Wealth — Established

   Returns an empty string for an unknown or missing slug. Printing a raw slug
   in a message is what these fields exist to avoid, so falling back to one
   would defeat the purpose. */
function blueprintTitle(slug: string | null): string {
  if (!slug) return ''
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' \u2014 ')
}

function buildPayload(a: AssessmentRow) {
  return {
    /* Flat keys, matching the lead payload convention. GHL maps top-level
       fields to custom fields directly; nesting means hand-written JSON paths
       for every field and a rename silently breaks the mapping. */

    /* THE JOIN KEYS. All three, deliberately.

       Jake reported on 2026-08-26 that the two deliveries were not merging into
       one contact — a contact created by the lead webhook, then a separate
       record from this one. The cause was almost certainly that this payload
       carried only phone and lead_id: GoHighLevel matches contacts on EMAIL
       first, so with no email there was nothing for it to match against.

       Sending all three means GHL can match on whichever it is configured to
       use, and lead_id remains available for tracing a specific submission. */
    lead_id: a.lead_id,
    phone: a.leads?.phone ?? '',
    email: a.leads?.email ?? '',

    /* Machine values, not display labels. These are what his workflow
       conditions match on, and they come from the same config that renders the
       buttons — so the two cannot drift apart. */
    /* ── MACHINE VALUES — MATCH CONDITIONS ON THESE ──────────────────────
       Underscored, stable, and identical to what renders the buttons on screen.

       ⚠ DO NOT RENAME THESE TO READ NICELY. Jake asked on 2026-09-03 whether
       the underscores could go. They cannot, for three reasons:

       · They are the stored values in `assessments`. Renaming is a migration
         across every existing row, not a payload change.
       · 19 leads already carry them. Mid-migration half the corpus would say
         `580_649` and half `580–649`, and a condition matching one would
         silently miss the other.
       · The dash in a label like `580–649` is an EN-DASH, not a hyphen. A
         condition typed with a hyphen would never match, and the failure is
         invisible — the workflow simply does not fire, with no error.

       His underlying point was right though: `under_1_month` reads badly in a
       notification. Hence the labels below. */
    financial_stage: a.financial_stage ?? '',
    credit_range: a.credit_range ?? '',
    emergency_fund: a.emergency_fund ?? '',
    budget_status: a.budget_status ?? '',
    currently_building: a.currently_building ?? '',
    biggest_blocker: a.biggest_blocker ?? '',

    /* ── DISPLAY LABELS — PRINT THESE IN MESSAGES ────────────────────────
       Added 2026-09-04 at Jake's request. Same answers, written the way a
       person reads them: `580–649` not `580_649`, `Less Than 1 Month` not
       `under_1_month`.

       Resolved through labelFor() from the same option list that renders the
       buttons, so what the attendee tapped and what Jake prints are guaranteed
       to be the same words. A new option gets a label automatically.

       Empty string when the question was skipped, matching the machine fields
       above — a missing key would look like a delivery fault, an empty one is
       a skip, which is a legitimate answer. */
    financial_stage_label: labelFor('financial_stage', a.financial_stage) ?? '',
    credit_range_label: labelFor('credit_range', a.credit_range) ?? '',
    emergency_fund_label: labelFor('emergency_fund', a.emergency_fund) ?? '',
    budget_status_label: labelFor('budget_status', a.budget_status) ?? '',
    currently_building_label: labelFor('currently_building', a.currently_building) ?? '',
    biggest_blocker_label: labelFor('biggest_blocker', a.biggest_blocker) ?? '',

    /* An unanswered question sends an empty value rather than being omitted.
       A missing key looks like a delivery problem; an empty one is a skip,
       which is a legitimate and expected answer. */

    /* Which roadmap they were actually shown. Lets his follow-up reference the
       right one rather than sending something generic. */
    blueprint_slug: a.blueprint_slug ?? '',

    /* Readable name of that roadmap, added 2026-09-04 with the labels above.
       The slug is `foundation` or `credit-established`; this is the headline the
       attendee actually read on screen. Same rule — match on the slug, print
       this. */
    blueprint_title: blueprintTitle(a.blueprint_slug),

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
