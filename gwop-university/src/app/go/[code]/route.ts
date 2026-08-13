import { redirect, RedirectType } from 'next/navigation'
import { QR_CODES, EVENT_PATH, type QrCode } from '@/config/integrations'

/* ═══════════════════════════════════════════════════════════════════════════
   TRACKER TASK 7 — THE PRINTED QR POINTS HERE, NEVER AT /830 DIRECTLY.
   This indirection is the only way to change the destination after printing.
   Change EVENT_PATH in src/config/integrations.ts and every printed code follows.
   ═══════════════════════════════════════════════════════════════════════════ */

export const runtime = 'edge'
export const dynamic = 'force-dynamic'   // never cache — must stay re-pointable

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params
  // Unknown codes must NEVER 404 — a dead QR at the booth is unrecoverable.
  const source = QR_CODES[code as QrCode] ?? 'unknown'
  redirect(`${EVENT_PATH}?s=${encodeURIComponent(source)}`, RedirectType.replace)
}
