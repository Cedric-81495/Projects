import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { admin } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import { logger } from '@/lib/observability/logger'
import { syncLeadToGhl } from '@/lib/ghl/sync'

/**
 * Drains leads stuck at 'pending' and retries the GHL forward.
 *
 * Two jobs, and the second is the one that matters on Aug 30:
 *   · Retries a lead whose forward failed — a blip, a timeout, GHL restarting.
 *   · Delivers everything captured while GHL_WEBHOOK_URL was unset. The sync
 *     no-ops without it, so leads accumulate safely and drain the moment Jake's
 *     URL is configured. Nothing is lost by shipping before he replies.
 *
 * Same constant-time secret comparison as the expiry sweep: a plain `!==` on a
 * secret is a timing oracle, and this endpoint writes to the client's CRM.
 *
 * ⚠ NOT SCHEDULED. See CRON-NOTE.md.
 *
 * Vercel Hobby allows one cron per day only; a sub-daily expression fails the
 * ENTIRE deployment, not just the cron. That blocked the 2026-08-19 builds. A
 * daily retry is useless at a booth, so the schedule was removed rather than
 * degraded, and the decision deferred.
 *
 * Nothing is lost meanwhile: leads save before forwarding and stay 'pending'
 * with the reason in last_error. Only the automatic calling is missing.
 *
 * Trigger by hand:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/v1/cron/lead-sync
 *
 * BEFORE AUG 30 — upgrade to Pro and restore:
 *   { "path": "/api/v1/cron/lead-sync", "schedule": "*\/2 * * * *" }
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Bounded so one invocation cannot run past the function timeout. */
const BATCH = 25

export async function GET(req: Request) {
  const provided = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  const expected = env.CRON_SECRET

  const a = Buffer.from(provided.padEnd(expected.length, '\0'))
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  if (!env.GHL_WEBHOOK_URL) {
    /* Not an error. Report the backlog so it is visible in cron logs rather
       than discovered as a surprise once the URL is finally set. */
    const { count } = await admin
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('sync_status', 'pending')

    logger.info('lead_sync_cron_unconfigured', { pending: count ?? 0 })
    return NextResponse.json({ skipped: true, pending: count ?? 0 })
  }

  const { data: pending, error } = await admin
    .from('leads')
    .select('id')
    .eq('sync_status', 'pending')
    .order('created_at', { ascending: true }) // oldest first — uses leads_pending_idx
    .limit(BATCH)

  if (error) {
    logger.error('lead_sync_cron_query_failed', { message: error.message })
    return new NextResponse('Failed', { status: 500 })
  }

  let synced = 0
  let stillPending = 0
  let failed = 0

  /* Sequential, not Promise.all. Twenty-five simultaneous posts to a CRM that
     is already struggling is how a retry turns into an outage. */
  for (const row of pending ?? []) {
    const result = await syncLeadToGhl(row.id)
    if (result === 'synced') synced++
    else if (result === 'failed') failed++
    else stillPending++
  }

  logger.info('lead_sync_cron_ok', { processed: pending?.length ?? 0, synced, stillPending, failed })
  return NextResponse.json({ processed: pending?.length ?? 0, synced, stillPending, failed })
}
