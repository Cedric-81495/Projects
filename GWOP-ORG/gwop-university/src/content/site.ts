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
  /* Still open. Felicia, Aug 18: "please confirm the exact legal entity name
     and city being used for A2P so Cedric can mirror it across the website and
     legal pages." The city came back; the entity name is with Surpaul / Jake. */
  entity:  { text: '[Legal Entity Name]', pending: true },
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