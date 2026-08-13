/* ═══════════════════════════════════════════════════════════════════════════
   TRACKER TASK 7 — QR GENERATION.   Run: pnpm qr
   Codes are generated IN THIS REPO, pointing at OUR domain. Never use a
   third-party QR service: if it expires or starts charging, every printed
   code in the room is dead and nothing can be done about it.
   ═══════════════════════════════════════════════════════════════════════════ */
import QRCode from 'qrcode'
import { mkdirSync } from 'node:fs'

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gwopu.com'
const CODES = { '1':'booth-lead','2':'greeter','3':'ambassador','4':'signup-specialist','5':'content-floater' }
const SIZES = { print: 2400, tabletop: 1200, card: 600 }

mkdirSync('qr-out', { recursive: true })

for (const [code, role] of Object.entries(CODES)) {
  const url = `${SITE}/go/${code}`
  for (const [name, width] of Object.entries(SIZES)) {
    await QRCode.toFile(`qr-out/gwop-${code}-${role}-${name}.png`, url, {
      errorCorrectionLevel: 'H',   // survives print smudges and a centre logo
      margin: 2,
      width,
      color: { dark: '#0B4F3AFF', light: '#FFFFFFFF' },
    })
  }
  await QRCode.toFile(`qr-out/gwop-${code}-${role}.svg`, url, {
    errorCorrectionLevel: 'H', margin: 2, type: 'svg',
    color: { dark: '#0B4F3AFF', light: '#FFFFFFFF' },
  })
  console.log(`${code}  ${role.padEnd(18)} → ${url}`)
}

console.log(`\n✅ qr-out/ ready. Backup link for the booth card: ${SITE}/go/1`)
console.log('⚠️  Field-test a PRINTED code before Aug 23 (dim light, 1 metre, iOS + Android).')
