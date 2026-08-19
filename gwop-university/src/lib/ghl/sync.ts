import 'server-only'
import { env } from '@/lib/env'
import { EVENT_TAG } from '@/config/integrations'
import { admin } from '@/lib/supabase/admin'
import { logger } from '@/lib/observability/logger'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Forward a captured lead to GoHighLevel's inbound webhook.
 *
 * Felicia, Aug 18: save server-side first, forward with retries, GHL remains
 * the operational CRM and marketing source of truth. This file is the second
 * half of that — /api/lead is the first.
 *
 * DESIGN NOTES
 *
 * · No-ops when GHL_WEBHOOK_URL is unset. That is deliberate: the whole flow
 *   ships and is testable before Jake sends the URL. Leads stack up as
 *   'pending' and the cron drains them the moment it is configured.
 *
 * · The webhook URL is a SERVER env var and must never be NEXT_PUBLIC. It is
 *   an unauthenticated write endpoint into the client's CRM — in client
 *   JavaScript it would be a public form anyone could flood.
 *
 * · Never throws to the caller. /api/lead already told the attendee they are
 *   done; a forwarding problem is ours to retry, not theirs to see.
 * ═══════════════════════════════════════════════════════════════════════════
 */

/** Retries exhausted. Beyond this a human looks at it. */
const MAX_ATTEMPTS = 5

/** Venue cellular is slow, but a booth cannot wait on a hung socket. */
const TIMEOUT_MS = 8_000

/** Payload shape sent to Jake. Field names are his to confirm — one place. */
interface LeadRow {
  id: string
  first_name: string
  last_name: string | null
  email: string
  phone: string
  interest: string
  interest_tag: string | null
  source: string | null
  utm: Record<string, string>
  consent_given: boolean
  consent_text: string
  consent_at: string
  created_at: string
  sync_attempts: number
}

function buildPayload(lead: LeadRow) {
  return {
    /* Flat keys, not nested. GHL's inbound webhook maps top-level fields to
       custom fields directly; nesting means Jake hand-writes JSON paths for
       every field and a rename silently breaks the mapping. */
    first_name: lead.first_name,
    last_name: lead.last_name ?? '',
    email: lead.email,
    phone: lead.phone, // already E.164

    interest: lead.interest,
    interest_tag: lead.interest_tag ?? '',

    source: lead.source ?? '',
    utm_source: lead.utm.utm_source ?? '',
    utm_medium: lead.utm.utm_medium ?? '',
    utm_campaign: lead.utm.utm_campaign ?? '',

    /* The consent record travels with the lead. Jake's system is where these
       people are messaged from, so the evidence of permission belongs there
       too — not only in our table. */
    sms_consent: lead.consent_given,
    sms_consent_text: lead.consent_text,
    sms_consent_at: lead.consent_at,

    /* From integrations.ts — the documented owner file for anything Jake
       confirms. Was a duplicated literal here, which meant correcting the tag
       in config would silently keep sending the old value on every lead. */
    event_tag: EVENT_TAG,
    submitted_at: lead.created_at,

    /* Our row id. Lets Jake trace a contact back to a submission, and lets a
       retry be recognised as the same lead rather than a new one. */
    lead_id: lead.id,
  }
}

export async function syncLeadToGhl(leadId: string): Promise<'synced' | 'pending' | 'failed'> {
  const url = env.GHL_WEBHOOK_URL
  if (!url) {
    // Not configured yet. Leave it pending; the cron will pick it up later.
    logger.info('lead_sync_skipped_unconfigured', { leadId })
    return 'pending'
  }

  const { data: lead, error } = await admin
    .from('leads')
    .select(
      'id, first_name, last_name, email, phone, interest, interest_tag, source, utm, ' +
        'consent_given, consent_text, consent_at, created_at, sync_attempts',
    )
    .eq('id', leadId)
    .single<LeadRow>()

  if (error || !lead) {
    logger.error('lead_sync_row_missing', { leadId, message: error?.message })
    return 'failed'
  }

  const attempt = lead.sync_attempts + 1

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        /* Lets Jake correlate a webhook delivery with our logs when something
           does not line up, without asking us to dig through a database. */
        'x-lead-id': lead.id,
      },
      body: JSON.stringify(buildPayload(lead)),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`GHL responded ${res.status}: ${body.slice(0, 200)}`)
    }

    await admin
      .from('leads')
      .update({ sync_status: 'synced', synced_at: new Date().toISOString(), sync_attempts: attempt, last_error: null })
      .eq('id', lead.id)

    logger.info('lead_synced', { leadId: lead.id, attempt })
    return 'synced'
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const exhausted = attempt >= MAX_ATTEMPTS

    await admin
      .from('leads')
      .update({
        sync_status: exhausted ? 'failed' : 'pending',
        sync_attempts: attempt,
        /* Always recorded. The migration's leads_failure_explained constraint
           rejects a 'failed' row with no reason, because an unexplained
           failure is unactionable at 8pm on event day. */
        last_error: message.slice(0, 500),
      })
      .eq('id', lead.id)

    logger[exhausted ? 'error' : 'warn'](
      exhausted ? 'lead_sync_exhausted' : 'lead_sync_retrying',
      { leadId: lead.id, attempt, message },
    )
    return exhausted ? 'failed' : 'pending'
  }
}