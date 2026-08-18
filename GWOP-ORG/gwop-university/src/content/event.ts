/* ═══════════════════════════════════════════════════════════════════════════
   8/30 EVENT PAGE COPY  —  OWNER: SURPAUL (offer)  ·  SUPPORT: MAUI
   Source: Visual Build Package p.7 + Tracker "8-30 SIGNUP FUNNEL" tab
   ═══════════════════════════════════════════════════════════════════════════ */
export const event = {
  /* Felicia §3: "Exact event time/location details can be inserted once
     confirmed." Editable placeholders so a late answer costs a one-line edit,
     not a layout change. Anything still `pending` is highlighted in DRAFT and
     is simply not rendered — a blank beats a wrong time on the signage page. */
  details: {
    name: 'Everybody Gotta Eat',
    date: 'August 30, 2026',
    time:     { text: '', pending: true },   // ← paste when Felicia confirms
    location: { text: '', pending: true },   // ← paste when Felicia confirms
  },

  // Prescribed by Visual Build Package p.7 + Felicia §2 — DO NOT REWORD
  h1a: 'BUILD YOUR',
  h1b: 'GWOP BLUEPRINT',
  kicker: 'Credit. Funding. Business. Wealth.',

  /* Felicia §2 "Supporting copy", verbatim. Note the fourth sentence — the
     event page carries it; the homepage hero (p.5) deliberately does not. */
  support:
    'Build your financial foundation. Strengthen your credit. Prepare your ' +
    'business for capital. Build toward long-term wealth.',

  cta: 'Start your blueprint',

  /* Felicia §2: "For QR/event signage, we can also use: SCAN TO START."
     Single approved source for Maui's print run — signage and screen must not
     drift apart. Maui pulls the wording from here, not from a chat message. */
  signage: {
    headline: 'BUILD YOUR GWOP BLUEPRINT',
    kicker: 'Credit. Funding. Business. Wealth.',
    qrCta: 'SCAN TO START',
    brandLine: 'GWOP UNIVERSITY · Knowledge Pays.',
  },

  // Offer — Surpaul approves (Tracker: due Aug 17)
  incentives: {
    h2: 'Three things, free, for showing up.',
    lede: 'Sign up at the table and all three are yours.',
    items: [
      { h: 'Free GWOP Wealth Blueprint',
        p: 'Your personal starting point, built around what you need help with.',
        pending: true },
      { h: 'Founding Member Access',
        p: 'Get in ahead of everyone else, at founding member terms.',
        pending: true },
      { h: 'Scholarship Chance',
        p: 'Everyone who signs up today is entered.',
        pending: true },
    ],
  },

  about: {
    h2: 'What is GWOP University?',
    lines: [
      'We teach everyday people how to go from financial confusion to financial confidence — credit, funding, business and wealth.',
      'Money does not respond to emotion. It responds to structure.',
      'We show you the structure.',
    ],
  },

  choose: {
    step: 'Step 1 of 2',
    h2: 'What do you want help with?',
    lede: 'Pick one and we’ll send the right blueprint.',
    skip: 'Not sure yet — just sign me up',
  },

  form: {
    step: 'Step 2 of 2 — your details',
    note: 'Takes under a minute.',
  },

  /* Felicia §11 prescribes this hierarchy: "YOU'RE IN." then "Your GWOP
     Blueprint starts here." then confirm delivery, then the next CTA. */
  thanks: {
    h1: 'You’re in.',
    h2: 'Your GWOP Blueprint starts here.',
    lede: 'Check your phone — your GWOP Blueprint is on its way by text and email.',

    /* Felicia §11 names both of these as the next CTA "based on the final
       offer". Both render; the founding-member one is wording-pending. */
    ctas: {
      primary:   { label: 'Explore GWOP University', href: '/' },
      /* Flip to `false` once Felicia confirms wording + destination (§11).
      Do NOT delete the key — `as const` makes its absence a type error. */
      /* Flip `pending` to false once Felicia confirms wording + destination
         (§11). Do NOT delete the key — `as const` on this object makes its
         absence a type error in thanks/page.tsx. `as boolean` widens the
         literal so either value type-checks. */
      secondary: { label: 'Become a Founding Member', href: '/830#gifts', pending: true as boolean },
    },

    /* Shown only once Jake sends the live booking link (BOOKING_URL).
       Jake, Aug 14: Beast's 1:1 GWOP Blueprint/Roadmap calendar, Mon–Fri 11–1. */
    booking: {
      h: 'Book your 1:1 Blueprint session',
      p: 'Sit down with Beast and walk through your roadmap. Mon–Fri, 11 AM–1 PM.',
      label: 'Pick a time',
      pending: true,
    },

    next: [
      { h: 'Watch for a text', p: 'Your starting point arrives in the next few minutes.' },
      { h: 'Talk to Surpaul', p: 'Come find him at the table — he’ll walk you through what your blueprint means.' },
      { h: 'Founding member', p: 'Ask about founding member access while you’re here.', pending: true },
    ],
  },
} as const
