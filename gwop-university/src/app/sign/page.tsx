import type { Metadata } from 'next'
import QRCode from 'qrcode'
import { event } from '@/content/event'
import { SITE_URL } from '@/config/integrations'

/* ═══════════════════════════════════════════════════════════════════════════
   VISUAL BUILD PACKAGE §06 — "WHAT THE 8/30 TABLE SHOULD LOOK LIKE"
   Piece 3: PHONE / AIRDROP — "Vertical graphic that opens the same event
   landing page."

   This is that piece, delivered as a route instead of a flat image. A staffer
   opens /sign, holds the phone up, the attendee scans. Same destination as the
   printed pieces, so §06's "One QR destination" holds.

   WHY A ROUTE AND NOT A PNG
   · The QR is generated from SITE_URL at build time, so it cannot drift from
     the printed run the way an exported image quietly does.
   · Copy comes from `event.signage`, the single approved source Maui prints
     from — screen and signage cannot say different things.
   · If /830 ever moves, this follows automatically. A PNG would not.

   NOT a replacement for pieces 1 and 2. Those are printed, and a phone screen
   at a booth dies, dims and glares. This is the third piece plus a fallback
   when someone's camera will not cooperate with paper.
   ═══════════════════════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: 'Scan to start — GWOP University',
  robots: { index: false, follow: false },
}

/* SITE_URL is a build-time value, so there is nothing per-request here. Static
   means it is served from the edge and survives a flaky venue connection once
   the staffer's phone has loaded it. */
export const dynamic = 'force-static'

const TARGET = `${SITE_URL}/go/1`

export default async function Sign() {
  /* Same options as scripts/generate-qr.mjs: level H tolerates a smudged card
     and a centre logo; margin 2 is the quiet zone scanners need to find the
     code at all. Kept identical so screen and print scan the same. */
  const qr = await QRCode.toString(TARGET, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 2,
    color: { dark: '#0D5B3FFF', light: '#FFFFFFFF' },
  })

  return (
    <main className="sign">
      <div className="sign-card">
        <p className="sign-brand">{event.signage.brandLine}</p>

        <h1 className="sign-h1">
          <span>{event.h1a}</span>
          <strong>{event.h1b}</strong>
        </h1>

        <p className="sign-kicker">{event.signage.kicker}</p>

        {/* The signature element of §06: the code is the hero, not an
            afterthought beside a button. Sized in vw so it fills whatever
            phone is held up, which is the whole point of the airdrop piece. */}
        <div className="sign-qr" dangerouslySetInnerHTML={{ __html: qr }} />

        <p className="sign-cta">{event.signage.qrCta}</p>

        {/* Spoken backup. scripts/generate-qr.mjs prints this for the same
            reason: when a camera will not focus, a staffer reads the address
            out and the signup still happens. */}
        <p className="sign-url">
          or go to <span>{TARGET.replace(/^https:\/\//, '')}</span>
        </p>
      </div>
    </main>
  )
}
