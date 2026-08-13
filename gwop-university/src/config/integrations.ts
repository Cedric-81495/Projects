/* ═══════════════════════════════════════════════════════════════════════════
   INTEGRATION POINTS  —  OWNER: JHON  ·  INPUT FROM: JAKE
   Everything that connects this site to another team member's system.
   Tracker tasks 3, 4, 7.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Jake's GoHighLevel form embed URL. Empty string = placeholder is shown. */
export const GHL_FORM_URL = process.env.NEXT_PUBLIC_GHL_FORM_URL ?? ''

/** Live site origin. Used by the QR generator and canonical links. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://gwopu.com'

/** Where the QR codes ultimately land. Task 1 route. */
export const EVENT_PATH = '/830'

/* ── TASK 7: QR SOURCE CODES ────────────────────────────────────────────────
   The printed QR encodes SITE_URL + /go/<code>. That redirect is what lets us
   change the destination AFTER printing. Never print a link to /830 directly.

   To re-point every printed code: change EVENT_PATH above. Nothing reprints.
   ────────────────────────────────────────────────────────────────────────── */
export const QR_CODES = {
  '1': 'booth-lead',
  '2': 'greeter',
  '3': 'ambassador',
  '4': 'signup-specialist',
  '5': 'content-floater',
} as const

export type QrCode = keyof typeof QR_CODES

/* ── TASK 4: INTEREST OPTIONS ───────────────────────────────────────────────
   ⚠️ OPEN: Felicia to confirm. Tracker lists 5 (incl. Wellness); the Visual
   Build Package p.6 lists 4. Jake needs one nurture branch per value here.
   Removing one = delete the line. The page and the form both read this list.
   ────────────────────────────────────────────────────────────────────────── */
export const INTERESTS = [
  { value: 'credit',   label: 'Credit' },
  { value: 'funding',  label: 'Funding' },
  { value: 'business', label: 'Business' },
  { value: 'wealth',   label: 'Wealth' },
  { value: 'wellness', label: 'Wellness', pending: true },
] as const

/** Sent when someone taps "not sure yet". Jake needs a default branch for it. */
export const INTEREST_FALLBACK = 'unspecified'

/** GHL source/tag for this event. Must match Jake's tag exactly. */
export const EVENT_TAG = 'EVENT - Everybody Gotta Eat - 08/30/26'

/** Draft mode: highlights unconfirmed copy and shows the status bar.
 *  Set to false only when every `pending` flag in src/content is cleared. */
export const DRAFT = true
