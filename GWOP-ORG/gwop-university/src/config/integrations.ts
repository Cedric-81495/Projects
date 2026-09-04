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
   ✅ RESOLVED — Felicia, Aug 14, 8:08 AM (directions §6 + §7).
   FIVE options. The 5-vs-4 mismatch against Visual Build Package p.6 is closed:
   p.6 was shorthand for the four financial tracks; Wellness is in.

   `label` = what the attendee taps (Felicia §6 wording, verbatim).
   `tag`   = the exact GHL tag Jake creates (Felicia §7 wording, verbatim).
   They differ on purpose — do not "tidy" either one. Jake needs one nurture
   branch per `tag`; a mismatch here means a lead gets no follow-up at all.
   ────────────────────────────────────────────────────────────────────────── */
export const INTERESTS = [
  { value: 'credit',           label: 'Credit',                      tag: 'Credit' },
  { value: 'funding',          label: 'Business Funding',            tag: 'Business Funding' },
  { value: 'entrepreneurship', label: 'Business / Entrepreneurship', tag: 'Entrepreneurship' },
  { value: 'wealth',           label: 'Wealth Building',             tag: 'Wealth Building' },
  { value: 'wellness',         label: 'Wellness',                    tag: 'Wellness' },
] as const

/** Sent when someone taps "not sure yet". Jake needs a default branch for it. */
export const INTEREST_FALLBACK = 'unspecified'

/* ⚠ ALIGNED TO JAKE'S TAG, 2026-09-04. Was
   'EVENT - Everybody Gotta Eat - 08/30/26'.

   Jake changed his GHL tag to `gwopsignup` on 2026-09-03. Ours still carried
   the event name, so two tag values were in circulation — his applied by his
   workflow, ours sitting unused in the payload. That is exactly how a condition
   quietly stops matching months later, so they are now one value.

   ⚠ MUST MATCH JAKE'S TAG CHARACTER FOR CHARACTER. Lower case, one word, no
   spaces, no hyphen. If he renames it again, this changes in the same breath —
   and he updates his condition FIRST, then we change the value, or new leads
   stop entering the nurture with no error anywhere.

   ⚠ NOT THE SAME THING AS EVENT_KEY. That still stamps `egc-2026-08-30` on
   every assessment and has NOT been changed — 19 rows hold it and his reporting
   groups on it. See the note in config/assessment.ts. */
export const EVENT_TAG = 'gwopsignup'

/* Jake's trained GHL chat widget, supplied 2026-08-19.
   Rendered ONLY on marketing pages — see ChatWidget.tsx. Empty string disables
   it everywhere, which is the switch to reach for if it misbehaves during the
   event rather than editing pages under pressure. */
/* Updated 2026-08-27 — Jake supplied a third widget. Previous IDs, newest
   first: 6a8ef044c9f1f7efa741592c (26 Aug), 6a79e193ae5432b1ab54efbc (19 Aug).
   Only the ID changes between them; the loader src and data-resources-url in
   Jake's embed snippet have been identical each time, so ChatWidget.tsx needs
   no edit.
   Empty string disables the widget everywhere without a deploy: the switch to
   reach for if it misbehaves on the day rather than editing pages under
   pressure. */
export const CHAT_WIDGET_ID = '6a903f99d45d62178f802e29'

/* ── CAMPAIGN ATTRIBUTION ───────────────────────────────────────────────────
   Felicia §7: "We do not necessarily need separate signup pages for every staff
   member... tracking attribution on the backend" and §3: "Tracking should happen
   through source/campaign parameters or GHL."

   So: ONE page, ONE QR destination. Attribution rides on query parameters that
   we forward straight into Jake's form. Anything not on this list is dropped —
   an allow-list, so a scanned URL can never inject arbitrary fields.
   ────────────────────────────────────────────────────────────────────────── */
export const CAMPAIGN_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
] as const

/* ── BEAST'S 1:1 BLUEPRINT CALENDAR ────────────────────────────────────────
   Jake's request, Aug 14, 8:30 AM. Availability Mon–Fri 11 AM–1 PM,
   GHL tag `GWOP – Blueprint 1:1`, Beast notified on booking.
   Paste the live GHL booking link here when Jake sends it. Empty = the CTA
   is hidden rather than shown broken.
   ────────────────────────────────────────────────────────────────────────── */
export const BOOKING_URL = process.env.NEXT_PUBLIC_BOOKING_URL ?? ''
export const BOOKING_TAG = 'GWOP – Blueprint 1:1'

/* ── COLD STANDBY ──────────────────────────────────────────────────────────
   Jake's draft funnel, Aug 14: preview-1786530807575155018.vibepreview.com
   ⚠️ NEVER PRINT THIS URL and never make it the QR destination — it is a
   preview host with a generated subdomain that can rotate or expire.
   Its only job: if our deploy fails at 2pm on Aug 30, we re-point
   /go/[code] here and the booth keeps capturing leads.
   ────────────────────────────────────────────────────────────────────────── */
export const STANDBY_FUNNEL_URL =
  'https://preview-1786530807575155018.vibepreview.com/#credit-review'

/* ── DRAFT MODE ─────────────────────────────────────────────────────────────
   ARCHITECTURE.md deviation 3: the DRAFT banner must never reach a real
   visitor, but the safeguard must survive someone forgetting to flip a flag.
   So it is derived, not hand-set.

   Draft stays ON for preview deployments AND for any *.vercel.app host — which
   is every deployment we have today, so testing is unaffected. It switches
   itself OFF the moment a real domain is serving production, which is exactly
   when an attendee could see it.

   Was a hardcoded `true`, meaning the banner would have shipped to the booth
   the day the domain was attached. */
const isPreview = process.env.VERCEL_ENV !== 'production'
const onVercelHost = (process.env.NEXT_PUBLIC_SITE_URL ?? '').includes('.vercel.app')

export const DRAFT = isPreview || onVercelHost