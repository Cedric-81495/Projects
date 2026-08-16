import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { admin } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import { logger } from '@/lib/observability/logger'

/**
 * Nightly expiry sweep. Wired up in vercel.json.
 *
 * Guarded by a shared secret compared in constant time — a plain `!==` on a
 * secret is a timing oracle, and this endpoint mutates access.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const provided = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  const expected = env.CRON_SECRET

  const a = Buffer.from(provided.padEnd(expected.length, '\0'))
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const { data, error } = await admin.rpc('expire_stale_enrollments')
  if (error) {
    logger.error('expiry_sweep_failed', { message: error.message })
    return new NextResponse('Failed', { status: 500 })
  }

  logger.info('expiry_sweep_ok', { expired: data })
  return NextResponse.json({ expired: data })
}
