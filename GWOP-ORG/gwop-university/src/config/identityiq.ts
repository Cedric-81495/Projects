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
  href: 'https://www.identityiq.com/sc-securepreferred.aspx?offercode=43129179',

  eyebrow: 'Optional next step',
  heading: 'Know what your report actually says',

  /* ── BLUEPRINT TEASER VIDEO ─────────────────────────────────────────────
     A short piece from Surpaul, above the CTA, framing why reading your report
     first matters. Held open until the file exists.

     `pending: true` means nothing renders to an attendee — same protection the
     Blueprint copy and the consent wording use. An empty player, a broken
     frame or a spinner that never resolves is worse than no video at all,
     particularly on venue cellular where a heavy embed competes with the
     signups happening at the same table.

     TO SWITCH ON:
       1. Upload to Bunny, take the video ID from the dashboard
       2. Put it in `bunnyId` below and set `pending: false`
       3. Add https://iframe.mediadelivery.net to `frame-src` in next.config.ts
          — the CSP blocks it otherwise, and it will fail silently with only a
          console error to show for it
       4. Watch it once on a phone on cellular before the event

     Unsigned embed, deliberately. The module player uses signed Bunny tokens
     because that content is paid; this is public marketing and a token would
     add a round trip for nothing. */
  video: {
    pending: true,
    bunnyId: '',
    title: 'A quick word from Surpaul',
    /* Under the player. Gives someone a reason to press play rather than
       scroll past it. */
    caption: '',
  },

  /* No claims, no outcomes, no numbers. Says why it is a sensible next move
     without promising what happens if they take it. */
  body:
    'Most people plan around what they think is on their credit report rather '
    + 'than what is on it. Reading it first is the cheapest thing you can do, '
    + 'and it changes what you should do next.',

  /* ⚠ THE LINE THAT MATTERS MOST.
     Verified against the live page on 2026-08-25: a flat $27.99/month, no
     trial. B had IdentityIQ remove the $1/7-day trial from the affiliate offer
     and supplied a new offer code the same day.

     Stating the figure matters because this card follows the word "free" on the
     same screen. Somebody handed something free by people they trust will tap
     the button assuming the next thing is free too. The price is the difference
     between an offer and a surprise.

     ⚠ If the offer code ever changes again, OPEN THE PAGE and check this
     number. It has already changed once. */
  cost:
    'IdentityIQ costs $27.99 per month. They are a separate company with their '
    + 'own terms and pricing.',

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
