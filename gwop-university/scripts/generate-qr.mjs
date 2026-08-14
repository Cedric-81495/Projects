/* ═══════════════════════════════════════════════════════════════════════════
   TRACKER TASK 7 — QR GENERATION.   Run: pnpm qr

   Visual Build Package p.6 names three physical pieces and only two carry a
   code, both of them the SAME code:

     1  MAIN TABLE SIGN   large headline + THE primary QR   → print size
     2  COUNTER CARD      same code, small, for close-up    → tabletop + card
     3  PHONE / AIRDROP   no code — a tappable link

   So the default output is ONE code at three sizes. One file for Maui to
   print, one code to field-test, and no scenario where the wrong card is in
   the wrong hand at the booth.

   Per-staff attribution is still available. It is OFF by default because
   Felicia §7 says separate signup pages per staff member are not required,
   and five printed variants means five codes to test before Aug 23.
   Turn it on only if someone will actually read per-staff numbers:

     ROLE_CODES=1 pnpm qr

   Codes are generated IN THIS REPO, pointing at OUR domain. Never use a
   third-party QR service: if it expires or starts charging, every printed
   code in the room is dead and nothing can be done about it.
   ═══════════════════════════════════════════════════════════════════════════ */
import QRCode from 'qrcode'
import { mkdirSync } from 'node:fs'

const SITE = process.env.NEXT_PUBLIC_SITE_URL

/* A guessed domain that reaches print is unrecoverable, so refuse rather than
   fall back. The previous default silently produced codes for gwopu.com. */
if (!SITE) {
  console.error('\n✖ NEXT_PUBLIC_SITE_URL is not set.')
  console.error('  Refusing to generate printable QR codes for a guessed domain.')
  console.error('  Run:  NEXT_PUBLIC_SITE_URL=https://your-domain.com pnpm qr\n')
  process.exit(1)
}
if (!/^https:\/\//.test(SITE)) {
  console.error(`\n✖ NEXT_PUBLIC_SITE_URL must be https — got "${SITE}".`)
  console.error('  A cert warning after a scan loses the signup.\n')
  process.exit(1)
}

/* p.6 piece → filename → pixel width. SVG is the master for print. */
const SIZES = { 'table-sign': 2400, 'counter-card': 1200, 'staff-card': 600 }

const OPTS = {
  errorCorrectionLevel: 'H',           // 30% recovery: print smudges, fingerprints, a centre logo
  margin: 2,                           // quiet zone — scanners need it, printers eat it
  color: { dark: '#0D5B3FFF', light: '#FFFFFFFF' },  // brand emerald on white
}

/* PRIMARY — the one code p.6 asks for. Role 1 is the booth lead, i.e. the
   table itself, which is why /go/1 is the primary destination. */
const targets = [{ code: '1', name: 'primary' }]

if (process.env.ROLE_CODES) {
  targets.push(
    { code: '2', name: 'greeter' },
    { code: '3', name: 'ambassador' },
    { code: '4', name: 'signup-specialist' },
    { code: '5', name: 'content-floater' },
  )
}

mkdirSync('qr-out', { recursive: true })

for (const { code, name } of targets) {
  const url = `${SITE}/go/${code}`
  for (const [piece, width] of Object.entries(SIZES)) {
    await QRCode.toFile(`qr-out/gwop-${name}-${piece}.png`, url, { ...OPTS, width })
  }
  await QRCode.toFile(`qr-out/gwop-${name}.svg`, url, { ...OPTS, type: 'svg' })
  console.log(`${name.padEnd(18)} → ${url}`)
}

console.log(`
qr-out/ ready.

  gwop-primary.svg               master for print, scales without softening
  gwop-primary-table-sign.png    2400px — main table sign (p.6 piece 1)
  gwop-primary-counter-card.png  1200px — counter card (p.6 piece 2)
  gwop-primary-staff-card.png     600px — staff handoff card

  Phone / airdrop graphic (p.6 piece 3) carries NO code — use the link:
  ${SITE}/go/1

  Spoken backup for staff when a scan fails: ${SITE}/go/1

Print sizing: roughly 10:1 distance to code size. Scanned from 1 metre wants
about 10cm of code, so the table sign should be larger, not smaller.

⚠️  Field-test a PRINTED code before Aug 23 — dim light, 1 metre, iOS + Android.
${process.env.ROLE_CODES ? '⚠️  ROLE_CODES on: 5 codes generated. Every one needs its own field test.' : 'Per-staff codes are off. Enable with ROLE_CODES=1 pnpm qr'}`)
