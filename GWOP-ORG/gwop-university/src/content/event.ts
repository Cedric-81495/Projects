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
  /* Dot separators per Felicia's 2026-08-26 mockup. Same four words as the
     Visual Build Package, punctuation only — the signage kicker below is left
     exactly as approved, because that one goes to print. */
  kicker: 'CREDIT • FUNDING • BUSINESS • WEALTH',

  /* Felicia §2 "Supporting copy", verbatim. Note the fourth sentence — the
     event page carries it; the homepage hero (p.5) deliberately does not. */
  support:
    'Build your financial foundation. Strengthen your credit. Prepare your ' +
    'business for capital. Build toward long-term wealth.',

  cta: 'START YOUR BLUEPRINT',

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
    /* Felicia §2, 2026-08-27: this line now carries the hero on its own. The
       longer `support` paragraph above it is no longer rendered — her reason:
       "This page is being scanned in a live event environment, so I want the
       value understood immediately." `support` is kept in this file because
       it is Visual Build Package p.7 copy; it is simply not shown on /830. */
    promise: 'See where you stand — and get your next 3 financial moves.',

    /* The three proof points, icons supplied by Shin 2026-08-27.
       Order matches her mockup: time, effort, outcome — cheapest commitment
       first, payoff last. */
    stats: [
      { icon: 'icon-seconds',   h: '60 SECONDS',   p: 'Quick to complete.' },
      { icon: 'icon-questions', h: '7 QUESTIONS',  p: 'Simple and straightforward.' },
      { icon: 'icon-moves',     h: '3 NEXT MOVES', p: 'Personalized for you.' },
    ],
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
    h2: 'Three benefits. Yours today.',
    lede: 'Sign up at the table and all three are yours.',
    items: [
      /* Wording supplied verbatim by Felicia, 2026-08-27 §3. `pending` flipped
         to false: she is the approver, and these are now her words. */
      { h: 'Free GWOP Blueprint',
        p: 'Your personalized starting point based on where you are now.',
        pending: false },
      { h: 'Founding Member Access',
        p: 'Get early access to GWOP University.',
        pending: false },
      { h: 'Scholarship Opportunity',
        p: 'Sign up today to be entered.',
        pending: false },
    ],
  },

  about: {
    h2: 'What is GWOP University?',
    lines: [
      /* Felicia §4, 2026-08-27, verbatim. */
      'GWOP University teaches the money game most of us were never taught — credit, funding, business and wealth.',
      'Money doesn’t respond to emotion. It responds to structure.',
      'We teach you the structure.',
    ],
  },

  choose: {
    /* ⚠ Says two; the flow is now seven questions plus a review screen. Left
       exactly as it was because nobody has approved replacement wording — not
       a change to make unilaterally. Flagged with Felicia. */
    step: 'Step 1 of 2',
    h2: 'What do you want help with?',
    lede: 'Choose where you need the most help right now.',
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

    /* ⚠ TWO ITEMS, NOT THREE, AND NEITHER PROMISES A DELIVERY.
       Felicia, 2026-08-27, ruling on the 8/30 scope: the journey is lead
       capture → Blueprint → booking, with no account creation on the day.

       · "Watch for a text" is gone. It promised a Blueprint by text that no
         nurture message actually sends, and the attendee has just read the
         Blueprint on screen — so there was nothing to deliver. Her words:
         "reword the on-screen line rather than promising delivery of something
         they've already seen. Follow-up can reinforce their next step." The
         replacement points at the booking, which is live and is the real next
         step.
       · The founding-member item is gone for Sunday. It was marked
         `pending: true`, but that flag never hid anything — Tbc renders its
         children plainly — so unapproved wording was live in front of every
         attendee. Felicia: "hide it for Sunday."

       ⚠ NextSteps hardcodes the count in its heading. If this array changes
       length again, fix the heading in Assessment.tsx too. */
    next: [
      { h: 'Talk to Surpaul', p: 'Come find him at the table — he’ll walk you through what your blueprint means.' },
      { h: 'Book your session', p: 'One hour with Beast to walk through your roadmap. Pick a time below.' },
    ],
  },
} as const