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
    /* ✅ CONFIRMED — Felicia, Aug 19: "The event is August 30, 2026, Central
       Square, Cambridge, MA, 12–6 PM. Please use that for the event page."
       The en-dash in "12–6 PM" is typographic and matches the rest of the copy.
       Do not "fix" it to a hyphen. */
    time:     { text: '12–6 PM', pending: false },
    location: { text: 'Central Square, Cambridge, MA', pending: false },
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

  /* Felicia, 2026-08-22: "keep the offer extremely simple — FREE GWOP
     BLUEPRINT™ / 60 seconds. 7 questions. Your next financial moves."

     Added BENEATH the prescribed headline rather than replacing it. Two
     reasons: h1a/h1b are marked DO NOT REWORD from the Visual Build Package,
     and `signage.headline` below carries the same words to Maui's print run —
     changing one without the other would put the table sign and the screen out
     of step days before it prints.

     ⚠ The ™ asserts a trademark claim. Worth confirming before print; it is
     the kind of symbol that is easy to add and awkward to walk back. */
  offer: {
    badge: 'FREE GWOP BLUEPRINT™',
    line: '60 seconds. 7 questions. Your next financial moves.',
  },

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
    /* ⚠ Says two; the flow is now seven questions plus a review screen. Left
       exactly as it was because nobody has approved replacement wording — not
       a change to make unilaterally. Flagged with Felicia. */
    step: 'Step 1 of 2',
    h2: 'What do you want help with?',
    lede: 'Pick one and we’ll send the right blueprint.',
    skip: 'Not sure yet — just sign me up',
  },

  form: {
    /* ⚠ Same as above — the count no longer matches the flow. Unchanged
       pending approved wording. */
    step: 'Step 2 of 2 — your details',
    note: 'Takes under a minute.',
    submit: 'Send my blueprint',
  },

  /* SMS consent shown beside the checkbox on /830.

     ⚠ OWNED BY JAKE, not us. Felicia 2026-08-18: "since this needs to align
     with the A2P registration/use case, please confirm the final approved SMS
     consent language for Cedric to place beside the checkbox." Do NOT write
     this ourselves — it is the legal record behind every message he sends.

     `pending: true` makes the form refuse to render, so placeholder legal text
     cannot reach an attendee. Flip to false the moment Jake supplies the text.
     `as boolean` widens the literal so either value type-checks. */
  consent: {
    /* APPROVED 2026-08-19. Wording supplied by Jake to match the A2P
       registration; business name confirmed as "GWOP University" by Felicia.

       Do not reword any part of this without going back to Jake — it is the
       legal record behind every message he sends, and the STOP/HELP keywords
       and the "not a condition of purchase" line are carrier requirements,
       not copy. */
    pending: false as boolean,
    text:
      'I consent to receive marketing text messages from GWOP University at ' +
      'the phone number provided. Message frequency may vary. Message and ' +
      'data rates may apply. Reply STOP to opt out and HELP for assistance. ' +
      'Consent is not a condition of purchase.',
    fine: 'Msg & data rates may apply. Reply STOP to opt out.',
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

    /* ✅ RESOLVED — Jake supplied the live booking link 2026-08-19, so
       BOOKING_URL is set and this block renders.
       Name matches his calendar exactly ("GWOP Blueprint/Roadmap") so the
       attendee does not tap "Blueprint session" and land on a page titled
       something else. Duration is his: 1 hr. */
    booking: {
      h: 'Book your 1:1 Blueprint / Roadmap session',
      p: 'One hour with Beast, walking through your roadmap. Mon–Fri, 11 AM–1 PM.',
      label: 'Pick a time',
      pending: false,
    },

    next: [
      { h: 'Watch for a text', p: 'Your starting point arrives in the next few minutes.' },
      { h: 'Talk to Surpaul', p: 'Come find him at the table — he’ll walk you through what your blueprint means.' },
      { h: 'Founding member', p: 'Ask about founding member access while you’re here.', pending: true },
    ],
  },
} as const