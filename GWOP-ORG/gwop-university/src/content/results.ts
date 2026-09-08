/* ═══════════════════════════════════════════════════════════════════════════
   VERIFIED RESULTS — the score cards for the testimonial section
   Owner: SURPAUL (approves + holds consent) · FELICIA (disclaimer wording)

   ⚠ THIS IS THE MOST REGULATED DATA IN THE REPO. READ BEFORE EDITING.

   Credit-repair advertising is FTC territory, and a gallery of score jumps is
   the exact shape of claim that draws attention. Three rules, none of them
   negotiable:

   1. NO FULL NAMES, NO EMAILS, NO SCREENSHOTS. The source material was CRM
      screenshots carrying full names and live email addresses
      (whitetanyac@aol.com and three others). Publishing somebody's credit
      score beside their email is a privacy problem regardless of how good the
      consent is. Identity here is initials plus a timeframe, and that is the
      most it may ever be without a fresh decision.

   2. NO BUREAU LOGOS. The screenshots carried Equifax, TransUnion, Experian
      and CreditHeroScore marks. Rendering those reads as those companies
      endorsing GWOP, which is a trademark and endorsement problem on top of
      everything else. Bureau names are plain text in the UI font. Never an
      image, never a colour lifted from their brand.

   3. `approved` STAYS FALSE UNTIL WRITTEN CONSENT IS ON FILE FOR EVERY PERSON
      LISTED — including the ones shown only as initials. Initials are not
      anonymity: a client can recognise their own numbers, and so can anyone
      who saw their file. Get it in writing, keep it, then flip the flag.

   ── WHY THESE FIVE AND NOT ALL FOURTEEN ───────────────────────────────────
   Featured: Rashaad C., Tanya W., Terrance D., Daron E., Duniesky C. — all
   positive across every bureau reported.

   Held back: Elvis D., Nathan J., Owen L. (positive but modest — reserve).
   Renee P., Vladimir D., Karleah M. (one bureau down). Tameika A. (all three
   down, eight negatives updated).

   Selecting your five strongest is ordinary marketing. But this site's posture
   is "the fine print, up front" and "this isn't a dispute mill", so the
   honest note below ships WITH the cards rather than being left off. It does
   more for credibility than a sixth card would.

   ── ⚠ INCOMPLETE DATA, DO NOT GUESS ──────────────────────────────────────
   The summary this was built from gave point movements for all five but
   before/after values for only one file. `before` and `after` are therefore
   nullable, and a card with nulls renders the delta alone — accurate, just
   less vivid.

   NOBODY MAY FILL THESE IN FROM MEMORY OR BY ARITHMETIC. A start score
   inferred by subtracting a delta from an end score is a number nobody
   measured, printed next to a real person's initials, in a regulated category.
   Take them from the actual reports or leave them null.
   ═══════════════════════════════════════════════════════════════════════════ */

export type BureauRow = {
  /** Plain text only. Never an image, never a bureau brand colour. */
  bureau: 'Equifax' | 'TransUnion' | 'Experian'
  /** ⚠ null until read off the real report. Never inferred from `delta`. */
  before: number | null
  /** ⚠ null until read off the real report. Never inferred from `delta`. */
  after: number | null
  /** Point movement. This is what the source summary actually gave us. */
  delta: number
}

export type ResultCard = {
  /** Initials only — see rule 1. */
  who: string
  /** e.g. '6 weeks'. Null when the file did not record one. */
  timeframe: string | null
  rows: BureauRow[]
  /** Rendered as a small gold chip. Omit when not recorded. */
  deletions: number | null
  /** Written consent on file for this individual. Set per person, not in bulk. */
  consent: boolean
}

export const RESULTS = {
  /* ⚠ THE MASTER GATE. False = the whole section does not render, cards or
     quotes. Flip only when every `consent` below is true AND Felicia has
     signed the disclaimer wording. */
  approved: false,

  eyebrow: 'Verified results',
  h2: 'What moving actually looks like.',

  /* ⚠ SHIPS WITH THE CARDS, NOT INSTEAD OF THEM. Removing this line turns an
     honest section into a claim. */
  honestNote:
    'Five of our results. Not every file moves like this, and some scores dip '
    + 'before they climb.',

  /* ⚠ ATTORNEY-OWNED. Null on purpose — a developer must not draft the
     disclaimer for a regulated results claim, and the component refuses to
     render the section while it is null even if `approved` is somehow true.
     Felicia writes this. It needs to cover, at minimum: results vary by
     individual, no specific score increase is guaranteed, and nothing shown is
     a promise of a particular outcome. */
  disclaimer: null as string | null,

  cards: [
    {
      /* Lead card — the strongest all-round movement, and the only one that
         reached a named score band on more than one bureau. */
      who: 'R.C.',
      timeframe: null,
      rows: [
        { bureau: 'Equifax', before: null, after: null, delta: 87 },
        { bureau: 'TransUnion', before: null, after: null, delta: 109 },
        { bureau: 'Experian', before: null, after: null, delta: 109 },
      ],
      deletions: null,
      consent: false,
    },
    {
      /* The only file with complete before/after in the source summary. */
      who: 'T.W.',
      timeframe: '6 weeks',
      rows: [
        { bureau: 'Equifax', before: 557, after: 679, delta: 122 },
        { bureau: 'TransUnion', before: 541, after: 576, delta: 35 },
        { bureau: 'Experian', before: 556, after: 663, delta: 107 },
      ],
      deletions: 37,
      consent: false,
    },
    {
      who: 'T.D.',
      timeframe: null,
      rows: [
        { bureau: 'Equifax', before: null, after: null, delta: 99 },
        /* 709 was the reported end score on TransUnion. `before` stays null
           rather than 709 − 130: that subtraction is not a measurement. */
        { bureau: 'TransUnion', before: null, after: 709, delta: 130 },
        { bureau: 'Experian', before: null, after: null, delta: 64 },
      ],
      deletions: null,
      consent: false,
    },
    {
      /* ⚠ TWO BUREAUS ONLY. The third was not reported, and an absent row is
         correct — do not add a third with delta 0, which would state that a
         bureau did not move. */
      who: 'D.E.',
      timeframe: null,
      rows: [
        { bureau: 'Equifax', before: null, after: null, delta: 125 },
        { bureau: 'TransUnion', before: null, after: null, delta: 120 },
      ],
      deletions: null,
      consent: false,
    },
    {
      who: 'D.C.',
      timeframe: null,
      rows: [
        { bureau: 'Equifax', before: null, after: null, delta: 88 },
        { bureau: 'TransUnion', before: null, after: null, delta: 23 },
        { bureau: 'Experian', before: null, after: null, delta: 56 },
      ],
      deletions: 38,
      consent: false,
    },
  ] as ResultCard[],

  /* ── WRITTEN QUOTES ───────────────────────────────────────────────────────
     Numbers prove it happened; a quote in someone's own voice makes a reader
     feel it. Numbers alone do not read as testimonial, which is why the
     section is two parts.

     Still empty. Same consent requirement as the cards, plus documentation for
     any result a quote mentions — a sentence claiming a number is the same
     claim as a card showing it. An empty array renders no quote block at all,
     and the cards stand on their own until then. */
  quotes: [] as ReadonlyArray<{ quote: string; who: string; consent: boolean }>,
}

/* ── IDENTITY FORMAT ────────────────────────────────────────────────────────
   Initials, not first name plus last initial.

   Both were on the table and "Tanya W." is warmer. Initials shipped because
   this is a regulated category and the section is unapproved either way, so
   the reversible choice is the safe one — widening later is a decision
   somebody makes on purpose, narrowing later means it was already published.

   To switch: edit `who` on each card. Nothing else changes. Worth pairing with
   Surpaul's consent conversation, since a client agreeing to "T.W." has not
   agreed to "Tanya W."
   ────────────────────────────────────────────────────────────────────────── */

/** True only when the section may render. Checked by the component. */
export const resultsPublishable = () =>
  RESULTS.approved &&
  RESULTS.disclaimer !== null &&
  RESULTS.cards.length > 0 &&
  RESULTS.cards.every(c => c.consent)
