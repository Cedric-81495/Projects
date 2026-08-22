/**
 * IDENTITYIQ — optional next step after the Blueprint.
 *
 * Felicia, 2026-08-22. Surpaul is an IdentityIQ affiliate and the link earns
 * commission. Presented as an optional next step, never as a condition of
 * receiving the free Blueprint.
 *
 * ── WHY THIS IS A CONFIG FILE ────────────────────────────────────────────────
 * Every string here is either legally required or legally risky. Keeping them
 * in one reviewable place means the attorney can read the whole disclosure
 * surface without opening a component, and a reword never touches JSX.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const identityiq = {
  /* Master switch. Set false and the card disappears everywhere — the escape
     hatch if anyone objects on the day, without a deploy. */
  enabled: true,

  /* Surpaul's affiliate link. Felicia was explicit: use this, not the separate
     $1 / 7-day offer.

     ⚠ Nobody has confirmed this resolves and registers against his account.
     A silently dead affiliate link is money we would never know we lost. */
  href: 'https://www.identityiq.com/sc-securepreferred.aspx?offercode=431291D8',

  eyebrow: 'Optional next step',
  heading: 'Know what your report actually says',

  /* No claims, no outcomes, no numbers. Says why it is a sensible next move
     without promising what happens if they take it. */
  body:
    'Most people plan around what they think is on their credit report rather '
    + 'than what is on it. Reading it first is the cheapest thing you can do, '
    + 'and it changes what you should do next.',

  /* ⚠ THE LINE THAT MATTERS MOST.
     IdentityIQ has no free tier and no free trial — every plan is a paid
     monthly subscription. This card follows the word "free" on the same screen,
     so somebody handed something free by people they trust will tap the button
     assuming the next thing is free too, and land on a payment page.
     Stating the cost is not optional caution; it is the difference between an
     offer and a surprise. */
  cost:
    'IdentityIQ is a paid monthly subscription — there is no free tier or trial. '
    + 'They are a separate company with their own terms and pricing.',

  /* Felicia's wording, verbatim.

     ⚠ OPEN QUESTION: this names GWOP University as the affiliate, but the
     affiliate account is Surpaul's. If the compensation goes to him personally
     rather than to the business, this names the wrong party and should read
     "Surpaul is an IdentityIQ affiliate…". Asked; not yet answered. The
     requirement is that the disclosure identifies whoever actually gets paid. */
  disclosure:
    'GWOP University is an IdentityIQ affiliate and may receive compensation if '
    + 'you enroll through this link.',

  /* Felicia's label, verbatim. */
  cta: 'Check My Credit Profile',

  /* Under the button. The promise was a free Blueprint and it has already been
     kept by this point — saying so removes any sense that the offer is a toll. */
  reassurance: 'Your Blueprint is yours either way.',
} as const
