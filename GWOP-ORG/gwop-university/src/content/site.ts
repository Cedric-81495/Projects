/* ═══════════════════════════════════════════════════════════════════════════
   WEBSITE COPY  —  OWNER: SURPAUL / FELICIA  ·  EDITED BY: MAUI
   Only what the Visual Build Package specifies. Do not add sections.
   `pending: true` = unconfirmed; highlighted while DRAFT is on.
   ═══════════════════════════════════════════════════════════════════════════ */
export const site = {
  brand:   'GWOP UNIVERSITY',
  motto:   'KNOWLEDGE PAYS',
  tagline: 'They never taught us the game — so we built the school.',

  /* Prescribed verbatim by Visual Build Package p.5. DO NOT REWORD.
     Exception: `sub` / `subKicker` replaced 2026-08-27 on Felicia's written
     instruction (§1 of her polish pass). She owns this copy and superseded
     p.5 explicitly, so the DO-NOT-REWORD note above still stands against
     anyone else editing it. */
  hero: {
    eyebrow:   'GWOP University',
    h1:        'Knowledge Pays.',
    sub:       'Learn the money game. Build your blueprint.',
    subKicker: 'Credit. Funding. Business. Wealth.',
    primary:   'Start your blueprint',
  },

  /* p.5 build note: "consistent course cards" */
  /* Felicia §12: leave space for the official social accounts.
     Paste the real URLs in. Any entry left empty is not rendered — we never
     ship a link to a handle that does not exist yet. */
  social: [
    /* ✅ CONFIRMED — Cedric, Aug 21. Tracking parameters stripped: the ones the
       apps append (igsh, _r, _t, si) identify the person who shared the link,
       so shipping them would attribute every visitor to whoever copied it. The
       bare URLs resolve to the same profiles. */
    { name: 'Instagram', url: 'https://www.instagram.com/gwopuniversity', pending: false },
    { name: 'TikTok',    url: 'https://www.tiktok.com/@gwopuniversity',   pending: false },
    { name: 'YouTube',   url: 'https://youtube.com/@cottrellenterprises', pending: false },
    /* Facebook and LinkedIn removed rather than left empty — an unlinked label
       reads as "coming soon", which is a promise nobody has made. Add them back
       here when the accounts are confirmed. */
  ],

} as const

/* ── LEGAL — ⚠️ ATTORNEY-SUPPLIED ONLY. Never draft or reword. ───────────── */
export const legal = {
  /* ✅ CONFIRMED — supplied 2026-08-27 in Felicia's polish pass §10: "replaced
     everywhere before launch with the exact registered legal entity name."
     ⚠ This string must match the entity registered for A2P exactly. If the A2P
     filing reads differently, the filing wins and this changes to match. */
  entity:  { text: 'Simple Strategy Consulting LLC', pending: false },
  /* ✅ CONFIRMED — Surpaul proposed Boston, Felicia agreed Aug 18: "Boston, MA
     works for me. It keeps everything consistent with the launch and current
     activation. We can always update the primary location later as GWOP
     expands." Treated as revisable by design, not as a placeholder. */
  address: { text: 'Boston, MA', pending: false },
  disclosure: {
    text: 'GWOP University provides financial education. We do not guarantee any specific outcome, score change, or funding approval. Accurate, current and verifiable information cannot be removed from a consumer credit report. Individual results vary.',
    pending: true,
  },
  sms: 'By providing your mobile number you consent to receive automated marketing text messages. Consent is not a condition of purchase. Msg & data rates may apply. Reply STOP to opt out.',
} as const