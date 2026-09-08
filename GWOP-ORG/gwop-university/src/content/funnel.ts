/* ═══════════════════════════════════════════════════════════════════════════
   FUNNEL COPY — APPROVED RE-LAYOUT OF /830
   Source: gwopfunnel-recommended-sequence_2.html
   Owner: Surpaul (approves) · Maui (edits) · Jhon (wiring)

   Every string the funnel renders lives here so a copy edit never touches JSX.
   Wording is transcribed VERBATIM from the approved mockup. Do not "improve"
   it — if a line reads oddly, that is a question for Surpaul, not an edit.

   ── WHAT IS SOURCED FROM ELSEWHERE, AND WHY IT IS NOT DUPLICATED HERE ──────
   The mockup's hero, honest bar and footer turned out to match values that
   already exist in the repo, exactly:

     "Knowledge Pays." / "Learn the money game…" / "Credit. Funding.
     Business. Wealth."              → site.hero  (Visual Build Package p.5)
     "Simple Strategy Consulting LLC" → legal.entity   (confirmed 2026-08-27)
     "Boston, MA"                     → legal.address  (confirmed 2026-08-18)
     "They never taught us the game — so we built the school."
                                      → site.tagline
     Instagram / TikTok / YouTube / LinkedIn
                                      → site.social    (confirmed Aug 21 + 27)
     The financial-education disclosure
                                      → legal.disclosure  (ATTORNEY-OWNED)

   Those are read from content/site.ts rather than retyped. A second copy of an
   approved legal entity name or an attorney's disclosure is how two surfaces
   end up saying different things about the same company, and the LinkedIn URL
   in particular is percent-encoded on purpose and must not be retyped.

   ── THE PRICES ────────────────────────────────────────────────────────────
   Not in this file. They are read from config/membership.ts through
   priceLabel(), which is the design Felicia asked for: "build the system so
   pricing can be changed easily without redesigning the website/app." The
   numbers in the mockup ($197 / $297 / $397 / $497, $997, 3×$397, "$1,388
   separately") are Surpaul's from his final-direction memo and are now in that
   file. See the header comment there for what is and is not live.
   ═══════════════════════════════════════════════════════════════════════════ */

export const funnel = {
  /* ── STICKY HEADER ─────────────────────────────────────────────────────── */
  header: {
    /* Brand and motto come from site.ts. This is the only clickable thing in
       the bar and it is a jump link to the form on this same page — not a
       route out. That keeps invariant 10 intact: nothing on this page takes
       somebody away from the assessment. */
    cta: 'Start My Blueprint',
  },

  /* ── HERO ──────────────────────────────────────────────────────────────────
     h1 / sub / subKicker are site.hero, prescribed by Visual Build Package
     p.5. Only the button label and the reassurance line are local. */
  hero: {
    cta: 'Start My Blueprint',
    micro: 'Takes about 3 minutes. Free. No obligation.',
  },

  /* ── HONEST BAR ────────────────────────────────────────────────────────────
     Three plain facts directly under the hero. The first is assembled from
     legal.address + legal.entity so it can never disagree with the footer or
     with the A2P filing. */
  honest: [
    /* item 1 is composed in the component from legal.* */
    'Founder-led sessions, not a call center',
    'Education first. No credit-repair contract required.',
  ],

  /* ── THE PROBLEM ───────────────────────────────────────────────────────── */
  problem: {
    tag: 'The problem',
    h2: 'They never taught us the game.',
    lede:
      'Most people learn about credit and money by getting hurt by them — a '
      + 'denied application, a collections call, a rate that made no sense at '
      + 'the time. Generic advice treats every situation the same, and yours '
      + "isn't the same as your neighbor's. It isn't even the same as it was "
      + 'two years ago.',
    items: [
      'Sent to a call center that reads from a script.',
      'Told to "dispute everything" and hope something sticks.',
      'Given advice for credit with nothing for funding or building forward.',
    ],
  },

  /* ⚠ WHAT ONE LEVEL BUYS. Added 2026-09-08 with per-level entitlement
     (0014_per_level_access.sql).

     Each level now grants that level only — which is what makes the memo's
     "I want the full GWOP University bundle to clearly be the best deal" true.
     Before, Level 4 at $497 unlocked all four and the $997 bundle had nothing
     to sell.

     But that is a material term of a $197–$497 purchase and the page said
     nothing about it. A reader looking at four priced cards has no way to know
     whether buying Level 3 also opens 1 and 2 — and the natural assumption is
     that it does, since the pathway is presented in order.

     Sits under the four cards rather than on each one: it applies to all of
     them, and repeating it four times reads as a warning rather than a term. */
  levelNote:
    'Each level is sold on its own — buying one level opens that level. '
    + 'The bundle opens all four.',

  /* ── PATHWAY ───────────────────────────────────────────────────────────────
     Heading and lede are PATHWAY_HEADING / PATHWAY_LEDE in content/pathway.ts.

     ⚠ THE MOCKUP CARRIES BOTH NAMING SYSTEMS AND THAT IS DELIBERATE.
     ⚠ STAGES REMOVED 2026-09-08. The approved layout showed "Stage 01 ·
     Foundation" above "Level 1 — Personal Credit"; Surpaul's memo then removed
     stages entirely, so the cards now render `label` + `title` — "Level 1" and
     "Personal Credit". The mockup's stage row is gone from every surface. See
     content/pathway.ts for the full history and for why the slugs did NOT
     move. */

  /* ── BUNDLE ────────────────────────────────────────────────────────────── */
  bundle: {
    eyebrow: 'Best value — the primary offer',
    h: 'GWOP University — All 4 Levels',
    body:
      'All four levels, in your account from day one — the platform shows the '
      + 'recommended order, but nothing is locked behind the level before it.',
    /* ⚠ REFUND SENTENCE. Rendered from REFUND_POLICY in config/membership.ts,
       not from this file, so the funnel and /refunds cannot disagree about the
       policy. See the note there — Surpaul's memo records this as "no refund
       (TBD)", and this string is what /refunds will publish too. */
    cta: 'Get GWOP University',
  },

  /* ── HOW IT WORKS ──────────────────────────────────────────────────────────
     Five steps. Steps 3 and 5 carry a qualifier after the title, rendered in
     muted type, which is what makes the optional things read as optional. */
  process: {
    tag: 'The process',
    h2: 'What happens after you sign up.',
    steps: [
      { h: 'Take your free assessment',
        p: 'A few minutes of honest answers about where you stand right now.' },
      { h: 'Get your Blueprint',
        p: "Where you are, what's holding you back, and your next 3 moves — "
         + 'built from your real answers, not a generic PDF.' },
      { h: 'Check My Credit Profile', qualifier: '— optional next step',
        /* ⚠ THE FIGURE AND THE DISCLOSURE ARE BOTH LOAD-BEARING.
           This paragraph names the price and the commission in the same breath
           as the word "free" appears elsewhere on the page. Somebody handed
           something free by people they trust will tap the button assuming the
           next thing is free too. The price is the difference between an offer
           and a surprise. Verified $27.99/month, no trial, on 2026-08-25 —
           the offer has already changed once, so re-verify before launch. */
        p: 'See exactly what\'s on your report before you plan around what you '
         + 'think is on it. This is IdentityIQ, a separate company — '
         + '$27.99/month, and GWOP University may earn a commission if you '
         + 'enroll. Your Blueprint is yours either way.' },
      { h: 'Book your 1:1 with Beast',
        p: 'One hour walking through your roadmap together. Mon–Fri, 11 AM–1 PM.' },
      { h: 'Watch a quick word from Surpaul', qualifier: "— when you're ready",
        p: 'Your Blueprint is just the beginning. This is here if you want it, '
         + "not in the way if you don't." },
    ],
  },

  /* ── DIFFERENTIATION ──────────────────────────────────────────────────────
     ⚠ THE LEFT COLUMN MAKES FACTUAL ASSERTIONS ABOUT THIRD PARTIES.
     "Promise a specific score increase", "route you through a call center",
     "recurring fees with unclear scope" are claims about identifiable
     competitors in a regulated category. It is in the approved layout so it
     ships, but it is the single most complaint-prone block on the page and
     whoever fields a complaint should know where it came from.

     Emptying `typical.items` removes the left column and reflows the right one
     to full width. One line, no layout work. */
  difference: {
    tag: 'The difference',
    h2: "Why this isn't a dispute mill.",
    typical: {
      h: 'MOST CREDIT REPAIR SHOPS',
      items: [
        'Promise a specific score increase',
        'Route you through a call center',
        'Stop at disputes — nothing on funding or building forward',
        'Recurring fees with unclear scope',
      /* Annotated as an array, not left as a tuple by `as const`: otherwise
         items.length is the literal type 4, and emptying this array to drop
         the competitor column becomes a type error rather than a one-line
         edit. (The testimonials block this note used to cross-reference was
         retired 2026-09-08 — see above.) */
      ] as ReadonlyArray<string>,
    },
    gwop: {
      h: 'GWOP UNIVERSITY',
      items: [
        "Tells you what's realistic for your actual situation",
        'Founder-led — you talk to a person, not a script',
        'Covers credit, funding, and building — one pathway',
        "You know what you're getting before you commit to a level",
      ],
    },
  },

  /* ── FOUNDER ───────────────────────────────────────────────────────────── */
  founder: {
    /* ⚠ NO `role` OR NAME FIELD HERE. Removed 2026-09-08.

       The card used to open with a "Founder" label and "Surpaul Cottrell" as
       its own heading — directly under the section h2, which already reads
       "Surpaul Cottrell — also known as Beast." His name appeared twice within
       about forty pixels, and "Founder" is the first word of the paragraph
       underneath it.

       The card is now the bio and the closing line. The section heading names
       him; the card says what he does. */
    tag: "Who's behind it",
    h2: 'Surpaul Cottrell — also known as Beast.',
    lines: [
      'Founder of GWOP University. Surpaul uses his real-world experience to '
      + 'teach personal credit, business credit, funding, and entrepreneurship. '
      + 'Through his 1:1 Blueprint Sessions, he helps clients understand where '
      + 'they stand and build a clear plan for their next move.',
    ],
    close: 'Real experience. Real education. Your next move starts here.',
  },

  /* ── TRUST ─────────────────────────────────────────────────────────────── */
  trust: {
    tag: 'Trust, in plain terms',
    h2: 'The fine print, up front.',
    items: [
      { icon: 'shield',
        h: 'Your data stays with the people helping you',
        p: "The assessment collects what's needed for your Blueprint — reviewed "
         + 'by Beast, not a call center.' },
      { icon: 'check',
        h: 'Education, not a credit-repair contract',
        p: "You're not signing a dispute-services agreement. You're learning a "
         + 'pathway and executing it yourself.' },
      { icon: 'calendar',
        h: 'No manufactured urgency',
        p: "1:1 sessions are limited by Beast's actual calendar — not a "
         + 'countdown timer.' },
    ],
    /* The disclosure paragraph and the three legal links are rendered from
       legal.disclosure. Attorney-owned, never drafted here. */
  },

  /* ── TESTIMONIALS — RETIRED 2026-09-08 ────────────────────────────────────
     The three placeholder quote slots that lived here are gone, and nothing
     renders from this key any more. The section is now built from
     content/results.ts: score cards first, then real written quotes.

     Why the placeholders were removed rather than kept: "Add a real student
     quote here." in a credit funnel persuades nobody and is still a claim on
     the page. The new section returns null until written consent is on file
     per individual and Felicia's results disclaimer exists, so there is no
     half-state where a placeholder can be glimpsed.

     Quotes go in RESULTS.quotes, not here. Each needs a real attribution,
     consent in writing, and documentation for any number the sentence
     mentions — a quote claiming a result is the same claim as a card showing
     it. */

  /* ── FAQ ───────────────────────────────────────────────────────────────────
     Nine items, verbatim. The last answer states prices and the refund
     position, so it is assembled in the component from the same
     config/membership.ts values the pathway cards use — a price stated in two
     places from two sources is a price that will eventually disagree with
     itself. `costAnswer` below is the shape; `{levels}`, `{bundle}`,
     `{savings}` and `{refund}` are substituted at render time. */
  faq: {
    /* ⚠ null, not a string. Changed 2026-09-08 — the section is now titled
       "Frequently Asked Questions", which already says what the eyebrow said.
       "Before you start" above "Frequently Asked Questions" is two labels for
       one thing.

       The component skips the eyebrow when this is null rather than rendering
       an empty <p>, so the heading sits at the top of the section with no gap
       where a label used to be. */
    tag: null as string | null,
    h2: 'Frequently Asked Questions',
    items: [
      { q: 'Is GWOP University a credit repair company?',
        a: "No. We're a financial education platform. We teach you how credit "
         + 'and funding actually work and give you a personalized plan — we '
         + "don't file disputes on your behalf or charge a credit-repair "
         + 'contract fee.' },
      { q: 'Can you guarantee my credit score will go up?',
        a: 'No — and anyone who guarantees a specific score increase should '
         + 'raise a flag. Your results depend on your starting point and what '
         + "you do with the plan. Beast will tell you what's realistic for your "
         + 'situation on your 1:1.' },
      { q: 'Will you remove accurate negative items from my report?',
        a: 'No one can legally do that — not us, not a lawyer, not any credit '
         + 'repair company. Accurate, current, and verifiable information stays '
         + "on your report by law. We focus on what's actually in your control "
         + 'going forward.' },
      { q: 'What do I actually get from the Blueprint?',
        a: 'A personalized breakdown built from your assessment answers — where '
         + 'you stand across credit, funding readiness, and building capacity, '
         + 'and what to prioritize first.' },
      { q: 'Who is Beast, and what happens on the call?',
        a: "Beast is Surpaul — the founder. He runs the 1:1 sessions himself. "
         + "You'll walk through your Blueprint together, in the order that makes "
         + 'sense for where you are, and leave with next steps — not a sales '
         + 'pitch.' },
      { q: 'Is my information secure?',
        a: 'We collect only what the assessment needs, and Beast is the one '
         + 'reviewing it with you — not a call center or a shared database.' },
      { q: 'Can this help with business funding, not just personal credit?',
        /* ⚠ WAS "The Junior and Senior levels" — the last academic naming on
           the page, and the pass that settled stages-vs-levels on 2026-09-08
           is that pass. Now names the levels the cards name. Approved copy was
           reworded here deliberately rather than left to contradict the four
           cards directly above it. */
        a: 'Yes. Levels 3 and 4 focus specifically on funding and scaling once '
         + 'your foundation is solid.' },
      { q: "I've tried credit repair before and it didn't work. Is this different?",
        a: 'If "credit repair" meant a company disputing items on your behalf, '
         + 'this is a different approach — education and a plan you execute, not '
         + 'a service you wait on.' },
      /* a: null → resolved from costAnswer at render time. */
      { q: 'What does it cost?', a: null },
    ],
  },

  /* Token-substituted so the numbers come from config/membership.ts. */
  costAnswer:
    'Your first assessment and Blueprint are free. Each level runs {levels} '
    + 'depending on depth, or get all four for {bundle} as a bundle (a {savings} '
    + 'savings), with a 3-payment plan available. {refund} so we\'ll walk through '
    + 'which level actually fits before you decide — no pressure on the call.',

  /* ── FINAL CTA ─────────────────────────────────────────────────────────────
     The section that holds the form. Heading and lede are the mockup's; the
     form itself is <InterestForm />, which is why the mockup's own three-field
     <form> is not used. See the note in app/830/page.tsx. */
  finalCta: {
    tag: 'Start here',
    h2: 'Build your Blueprint.',
    lede:
      'Three minutes of honest answers. One personalized plan. Zero obligation '
      + 'to book anything after.',
  },

  /* ── FOOTER ────────────────────────────────────────────────────────────────
     ⚠ LEGAL BLOCK ONLY, per the approved screenshot: entity in bold, the
     disclosure, the SMS line, then these five links in gold.

     The mockup's four-column grid — brand block, socials, Pathway, University —
     is NOT included. Cut deliberately, and it also removes the two links that
     led nowhere useful: "Student area" lands on a login wall a first-time
     visitor has no account for, and the Pathway column was four non-links.

     Entity, address and the disclosure come from content/site.ts. */
  footer: {
    legalLinks: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms & Conditions', href: '/terms' },
      { label: 'SMS Terms & Consent', href: '/sms-terms' },
      { label: 'Refund & Cancellation', href: '/refunds' },
      { label: 'Disclosures', href: '/disclosures' },
    ],
  },
} as const
