/* ═══════════════════════════════════════════════════════════════════════════
   WEBSITE COPY  —  OWNER: SURPAUL / FELICIA  ·  EDITED BY: MAUI
   Only what the Visual Build Package specifies. Do not add sections.
   `pending: true` = unconfirmed; highlighted while DRAFT is on.
   ═══════════════════════════════════════════════════════════════════════════ */
export const site = {
  brand:   'GWOP UNIVERSITY',
  motto:   'KNOWLEDGE PAYS',
  tagline: 'They never taught us the game — so we built the school.',

  /* Prescribed verbatim by Visual Build Package p.5. DO NOT REWORD. */
  hero: {
    eyebrow:   'GWOP University',
    h1:        'Knowledge Pays.',
    sub:       'Build your financial foundation. Strengthen your credit. Prepare your business for capital.',
    primary:   'Start your blueprint',
    secondary: 'See the pathway',
  },

  /* p.5 build note: "consistent course cards" */
  courseNote: 'Four levels. One blueprint. Study in order.',

  /* p.4 — "The university should visually show progression." */
  pathway: {
    tag:  '01 / Course Experience',
    h2:   'The 4-Level Pathway',
    lede: 'Each level has a clear purpose and a clear outcome.',
  },

  cta: {
    h2: 'Start With Your Blueprint.',
    p:  'Begin with a free review — no cost, no credit check, no obligation.',
    button: 'Get started',
  },
} as const

/* ── LEGAL — ⚠️ ATTORNEY-SUPPLIED ONLY. Never draft or reword. ───────────── */
export const legal = {
  entity:  { text: '[Legal Entity Name]', pending: true },
  address: { text: '[City, State]', pending: true },
  disclosure: {
    text: 'GWOP University provides financial education. We do not guarantee any specific outcome, score change, or funding approval. Accurate, current and verifiable information cannot be removed from a consumer credit report. Individual results vary.',
    pending: true,
  },
  sms: 'By providing your mobile number you consent to receive automated marketing text messages. Consent is not a condition of purchase. Msg & data rates may apply. Reply STOP to opt out.',
} as const
