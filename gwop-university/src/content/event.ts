/* ═══════════════════════════════════════════════════════════════════════════
   8/30 EVENT PAGE COPY  —  OWNER: SURPAUL (offer)  ·  SUPPORT: MAUI
   Source: Visual Build Package p.7 + Tracker "8-30 SIGNUP FUNNEL" tab
   ═══════════════════════════════════════════════════════════════════════════ */
export const event = {
  badge: { text: 'Everybody Gotta Eat · Aug 30', pending: true },

  // Prescribed by Visual Build Package p.7
  h1a: 'BUILD YOUR',
  h1b: 'GWOP BLUEPRINT',
  kicker: 'Credit. Funding. Business. Wealth.',
  cta: 'Start your blueprint',
  fine: 'Free · Takes 2 minutes · Sent straight to your phone',

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

  thanks: {
    h1: 'You’re in.',
    lede: 'Check your phone — your GWOP Blueprint is on its way by text.',
    next: [
      { h: 'Watch for a text', p: 'Your starting point arrives in the next few minutes.' },
      { h: 'Talk to Surpaul', p: 'Come find him at the table — he’ll walk you through what your blueprint means.' },
      { h: 'Founding member', p: 'Ask about founding member access while you’re here.', pending: true },
    ],
  },
} as const
