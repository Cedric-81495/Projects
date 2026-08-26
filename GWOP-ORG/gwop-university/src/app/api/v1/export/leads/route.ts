import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { admin } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import { logger } from '@/lib/observability/logger'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * GET /api/v1/export/leads  →  CSV of every lead and their assessment answers.
 *
 * Felicia, 2026-08-27: an end-of-day export as a second copy of the data.
 *
 * WHY THIS EXISTS: four hundred leads are the entire value of the activation,
 * and until the plan changes they live in one place with no point-in-time
 * recovery. A file someone downloads and keeps removes that single point of
 * failure entirely — no integration, no dependency, no platform between the
 * data and the client.
 *
 * Guarded by the same shared secret as the cron routes, compared in constant
 * time. This returns every attendee's name, phone and email in one response,
 * so it is the single most sensitive endpoint in the project.
 *
 * NOT scheduled. Run by hand when it is wanted:
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     "https://go.thegwopblueprint.com/api/v1/export/leads?event=egc-2026-08-30" \
 *     -o gwop-leads.csv
 *
 * Deliberately manual: a scheduled job writing personal data somewhere on a
 * timer is a liability nobody asked for.
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Row {
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  interest: string | null
  interest_tag: string | null
  source: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  consent_given: boolean | null
  consent_text: string | null
  consent_at: string | null
  sync_status: string | null
  created_at: string
  assessments: {
    status: string | null
    financial_stage: string | null
    credit_range: string | null
    emergency_fund: string | null
    budget_status: string | null
    currently_building: string | null
    biggest_blocker: string | null
    blueprint_slug: string | null
    event_key: string | null
    completed_at: string | null
  }[] | null
}

/**
 * Excel and Sheets both treat a leading `=`, `+`, `-` or `@` as a formula, so a
 * name like `=cmd()` becomes executable when the file is opened. Prefixing a
 * quote neutralises it. Worth doing on any field a stranger typed.
 */
function cell(v: unknown): string {
  if (v === null || v === undefined) return ''
  let s = String(v)
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  /* Always quote and escape: consent text contains commas, and a phone number
     starting with + must survive as text. */
  return `"${s.replace(/"/g, '""')}"`
}

const HEADERS = [
  'first_name', 'last_name', 'email', 'phone',
  'interest', 'interest_tag', 'source',
  'utm_source', 'utm_medium', 'utm_campaign',
  'consent_given', 'consent_text', 'consent_at',
  'assessment_status', 'financial_stage', 'credit_range', 'emergency_fund',
  'budget_status', 'currently_building', 'biggest_blocker',
  'blueprint_slug', 'completed_at',
  'ghl_sync_status', 'event_key', 'submitted_at',
]

export async function GET(req: Request) {
  const provided = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  const expected = env.CRON_SECRET

  const a = Buffer.from(provided.padEnd(expected.length, '\0'))
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  /* Optional ?event= filter. Without it you get everything, test rows included,
     which is rarely what anyone wants. */
  const eventKey = new URL(req.url).searchParams.get('event')

  const { data, error } = await admin
    .from('leads')
    .select(
      'first_name, last_name, email, phone, interest, interest_tag, source, ' +
        'utm_source, utm_medium, utm_campaign, consent_given, consent_text, ' +
        'consent_at, sync_status, created_at, ' +
        'assessments(status, financial_stage, credit_range, emergency_fund, ' +
        'budget_status, currently_building, biggest_blocker, blueprint_slug, ' +
        'event_key, completed_at)',
    )
    .order('created_at', { ascending: true })
    .returns<Row[]>()

  if (error) {
    logger.error('lead_export_failed', { message: error.message })
    return new NextResponse('Failed', { status: 500 })
  }

  const rows = (data ?? []).filter((r) => {
    if (!eventKey) return true
    /* A lead with no assessment has no event_key of its own — it belongs to the
       filtered event if it has no assessment at all, since abandons are exactly
       what we do not want to lose from the export. */
    const a = r.assessments?.[0]
    return !a || a.event_key === eventKey
  })

  const lines = [HEADERS.join(',')]
  for (const r of rows) {
    const a = r.assessments?.[0]
    lines.push([
      cell(r.first_name), cell(r.last_name), cell(r.email), cell(r.phone),
      cell(r.interest), cell(r.interest_tag), cell(r.source),
      cell(r.utm_source), cell(r.utm_medium), cell(r.utm_campaign),
      cell(r.consent_given), cell(r.consent_text), cell(r.consent_at),
      cell(a?.status), cell(a?.financial_stage), cell(a?.credit_range),
      cell(a?.emergency_fund), cell(a?.budget_status),
      cell(a?.currently_building), cell(a?.biggest_blocker),
      cell(a?.blueprint_slug), cell(a?.completed_at),
      cell(r.sync_status), cell(a?.event_key), cell(r.created_at),
    ].join(','))
  }

  logger.info('lead_export', { rows: rows.length, eventKey })

  const stamp = new Date().toISOString().slice(0, 10)
  return new NextResponse(
    /* BOM so Excel opens UTF-8 correctly — without it, accented names arrive
       mangled and someone spends an afternoon on it. */
    '\uFEFF' + lines.join('\n'),
    {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="gwop-leads-${stamp}.csv"`,
        /* Never cached, never indexed. */
        'cache-control': 'no-store',
        'x-robots-tag': 'noindex',
      },
    },
  )
}
