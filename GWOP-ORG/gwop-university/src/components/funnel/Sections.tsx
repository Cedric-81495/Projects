/* ═══════════════════════════════════════════════════════════════════════════
   FUNNEL SECTIONS — exact port of the approved mockup
   Source: gwopfunnel-recommended-sequence_2.html

   Markup follows the mockup element for element. Where the mockup used an
   inline style, it became a class in funnel.css with the same values — that is
   the only liberty taken, and it is because four pathway cards repeating the
   same inline price style is four chances for one of them to drift.

   Copy comes from content/funnel.ts. Prices come from config/membership.ts
   through the same helpers the rest of the app uses. Brand, entity, address,
   disclosure and the hero headline come from content/site.ts, which already
   held them as confirmed values — retyping a confirmed legal entity name or an
   attorney's disclosure is how two surfaces end up disagreeing.

   All server components. No 'use client', no inline <script>. The mockup's
   three IIFEs are not ported: the FAQ is <details>, the anchor scroll is CSS
   (globals.css already sets scroll-behavior), and the teaser player lives
   inside Assessment.tsx where it already exists with a real Bunny stream.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { ReactNode } from 'react'

import { site, legal } from '@/content/site'
import { funnel } from '@/content/funnel'
import { RESULTS, resultsPublishable } from '@/content/results'
import { PATHWAY, PATHWAY_HEADING, PATHWAY_LEDE } from '@/content/pathway'
import {
  LEVELS, BLUEPRINT_BUNDLE, REFUND_POLICY,
  oneTimeLabel, priceLabel, separateTotal, planTotal, fmtMoney,
} from '@/config/membership'
import { Tbc } from '@/components/Chrome'

/* ── THE CREST ─────────────────────────────────────────────────────────────
   ⚠ CORRECTED 2026-09-08. This was pointing at /hero-crest-400, which is the
   WRONG ASSET in two ways:

     crest-128.png       116 × 128   — the crest on its own
     crest-256.png       232 × 256   — same, at 2× for a 120px slot
     hero-crest-400.png  400 × 610   — the crest PLUS the lockup beneath it

   hero-crest-400 is a portrait composition, not the mark. Rendered into the
   design's square 120px seal it came out 120 × 183 and carried the lockup text
   with it, which is not what the mockup draws. It is also 88 KB of WebP for a
   120px box — roughly three times the bytes of the right file.

   So: crest-128 for the 36px header, crest-256 for the 120px hero seal. Each
   gives ~2× for its slot, which is what a retina phone needs and no more.

   /hero-crest-400 and /hero-crest-600 stay in public/ — the homepage hero uses
   them, correctly, at a size where the lockup is legible. Do not repoint those.

   Not using the shared <Crest> from components/Chrome.tsx because it hardcodes
   crest-128 and forces a square width/height. The hero needs the 256 source and
   the crest is 116 × 128, so a forced square distorts it a little at 120px.
   Same asset family, sized per slot. */
function Crest({ className, size, src }: {
  className?: string
  size: number
  /* '128' for the header, '256' for the hero. Explicit rather than derived
     from `size`, so bumping a display size never silently upgrades the
     download. */
  src: '128' | '256'
}) {
  /* 116 × 128 is the intrinsic ratio of both files. Passing the real
     proportions lets Next reserve the right box, so the crest does not shift
     the hero when it loads. */
  const h = size
  const w = Math.round(size * (116 / 128))

  return (
    <picture>
      <source srcSet={`/crest-${src}.webp`} type="image/webp" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={className}
        src={`/crest-${src}.png`}
        alt="GWOP University crest"
        width={w}
        height={h}
      />
    </picture>
  )
}

/* ══ HEADER ════════════════════════════════════════════════════════════════
   Brand block plus one gold button. The button is a jump link to #start on
   this same page, so invariant 10 holds — nothing in this bar takes somebody
   away from the assessment. */
export function FunnelHeader() {
  return (
    <header className="fn-header">
      <nav className="fn-nav">
        <a className="fn-brand" href="#top">
          <Crest size={36} src="128" />
          <span className="fn-brand-text">
            {site.brand}<small>{site.motto}</small>
          </span>
        </a>
        <a className="fn-btn" href="#choose">{funnel.header.cta}</a>
      </nav>
    </header>
  )
}

/* ══ HERO ══════════════════════════════════════════════════════════════════
   Centred, 120px crest that settles in, serif h1, italic serif sub, gold tag
   row, gold button, micro line.

   h1 / sub / tagrow are site.hero — Visual Build Package p.5, marked DO NOT
   REWORD, and the same words Maui's print run pulls from. The mockup's text is
   identical to those values, so nothing is lost by reading them from there. */
export function Hero() {
  return (
    <section className="fn-hero fn-wrap">
      <Crest className="fn-seal" size={120} src="256" />
      <h1>{site.hero.h1}</h1>
      <p className="fn-sub">{site.hero.sub}</p>
      <p className="fn-tagrow">{site.hero.subKicker}</p>
      <a className="fn-btn" href="#choose">{funnel.hero.cta}</a>
      <p className="fn-micro">{funnel.hero.micro}</p>
    </section>
  )
}

/* ══ HONEST BAR ════════════════════════════════════════════════════════════
   Item one is composed from legal.address + legal.entity rather than typed, so
   it cannot disagree with the footer or with the A2P filing. */
export function HonestBar() {
  return (
    <div className="fn-honest">
      <div className="fn-wrap">
        <span className="fn-honest-item">
          {legal.address.text} — {legal.entity.text}
        </span>
        {funnel.honest.map(h => (
          <span className="fn-honest-item" key={h}>{h}</span>
        ))}
      </div>
    </div>
  )
}

/* ══ PROBLEM ═══════════════════════════════════════════════════════════════ */
export function Problem() {
  return (
    <section className="fn-section fn-wrap">
      <div className="fn-editorial">
        <p className="fn-eyebrow">{funnel.problem.tag}</p>
        <h2>{funnel.problem.h2}</h2>
        <p>{funnel.problem.lede}</p>
        <ul className="fn-painlist">
          {funnel.problem.items.map(i => <li key={i}>{i}</li>)}
        </ul>
      </div>
    </section>
  )
}

/* Price by pathway slug. Module-level so the slug → price mapping is in one
   place rather than inlined in the render. */
const LEVEL_PRICE: Record<string, number | null> = Object.fromEntries(
  LEVELS.map(l => [l.slug, l.oneTime]),
)

/* ══ PATHWAY + BUNDLE ══════════════════════════════════════════════════════
   Four cards on a gold connector line, then the offer card.

   ⚠ STAGES REMOVED 2026-09-08. The approved layout drew a stage row above the
   level title; Surpaul's memo then removed stages entirely, so each card is
   now `label` + `title` — "Level 1" over "Personal Credit". No slug moved; see
   content/pathway.ts.

   Prices go through oneTimeLabel() / priceLabel(), so PRICING_PUBLISHED is
   still the single switch that governs whether a number can appear anywhere on
   this page. "$1,388 separately" is computed from the four cards, never typed,
   so it cannot drift from them. */
export function PathwayAndBundle() {
  const sep = separateTotal()

  return (
    <section className="fn-section fn-wrap">
      <div className="fn-pathway-head">
        <h2>{PATHWAY_HEADING}</h2>
        <p className="fn-lede">{PATHWAY_LEDE}</p>
      </div>

      <div className="fn-path-row">
        {PATHWAY.map(l => (
          <div className="fn-path-card" key={l.slug}>
            <div className="fn-dot" />
            <p className="fn-class">{l.label}</p>
            <h3>{l.goal}</h3>
            <p className="fn-lvl">{l.title}</p>
            <p>{l.detail}</p>
            <p className="fn-price">{oneTimeLabel(LEVEL_PRICE[l.slug])}</p>
          </div>
        ))}
      </div>

      <p className="fn-levelnote">{funnel.levelNote}</p>

      {/* ── THE BUNDLE — the primary offer, per Surpaul's memo ───────────── */}
      <div className="fn-offer-card">
        <div className="fn-offer-card__body">
          <p className="fn-eyebrow">{funnel.bundle.eyebrow}</p>
          <h3>{funnel.bundle.h}</h3>
          <p>{funnel.bundle.body}</p>

          {/* ⚠ THE REFUND SENTENCE. One source — REFUND_POLICY in
              config/membership.ts — shared with the FAQ's cost answer and with
              /refunds, so the three cannot disagree.

              <Tbc> REMOVED 2026-09-08: Surpaul approved the position ("REFUND
              POLICY - no refund"), so this is settled copy rather than a
              placeholder. Leaving the draft marker on approved legal wording
              teaches everyone to ignore the marker. */}
          <p className="fn-offer-refund">{REFUND_POLICY.text}</p>
        </div>

        <div className="fn-offer-card__aside">
          {sep !== null && (
            <p className="fn-offer-was">{fmtMoney(sep)} separately</p>
          )}
          <p className="fn-offer-price">{priceLabel(BLUEPRINT_BUNDLE.oneTime)}</p>
          {BLUEPRINT_BUNDLE.monthly !== null && (
            <p className="fn-offer-note">
              {/* ⚠ "monthly" is from the memo — "3 monthly payments of $397".
                  The approved mockup said "3 payments of $397", written before
                  his final direction. Without the cadence a reader does not
                  know whether that is three weeks or three months, on a plan
                  that totals $1,191. */}
              or {BLUEPRINT_BUNDLE.planMonths} monthly payments of{' '}
              {fmtMoney(BLUEPRINT_BUNDLE.monthly)}
              {/* ⚠ THE PLAN TOTAL IS STATED, per Surpaul's memo §1 — "Total on
                  payment plan: $1,191". The plan costs $194 more than paying
                  once, and leaving that as arithmetic for the reader is the
                  kind of omission that reads as a trick when they notice.
                  Computed, so it cannot drift from the figure beside it. */}
              {planTotal() !== null && <> &middot; {fmtMoney(planTotal()!)} total</>}
            </p>
          )}

          {/* His words, §1. The condition that matters most to whoever picks
              the plan, and it was only in the memo. */}
          <p className="fn-offer-plannote">{BLUEPRINT_BUNDLE.planNote}</p>

          {/* ⚠ POINTS AT #choose, NOT AT A CHECKOUT — which is what the mockup
              does, and the only honest destination today. Checkout is gated
              three ways: membership_plans.published is false, STRIPE_MODE is
              test, and /api/v1/checkout requires auth: 'student'. A button
              labelled "Get GWOP University" that dead-ends at a login wall is
              worse than one that leads to the free Blueprint. */}
          <a className="fn-btn" href="#choose">{funnel.bundle.cta}</a>
        </div>
      </div>
    </section>
  )
}

/* ══ THE PROCESS ═══════════════════════════════════════════════════════════
   Five steps, serif numerals, hairline rules. Steps 3 and 5 carry a qualifier
   in muted type — that is what makes the optional things read as optional. */
export function Process() {
  return (
    <section className="fn-section fn-section--forest">
      <div className="fn-wrap">
        <p className="fn-eyebrow" style={{ marginBottom: 14 }}>{funnel.process.tag}</p>
        <h2 style={{ fontSize: 'clamp(30px,4vw,42px)', marginBottom: 44, maxWidth: 560 }}>
          {funnel.process.h2}
        </h2>
        <div className="fn-steps">
          {funnel.process.steps.map((s, i) => (
            <div className="fn-step" key={s.h}>
              <span className="fn-num">{i + 1}</span>
              <div>
                <h3>
                  {s.h}
                  {'qualifier' in s && s.qualifier && (
                    <span className="fn-q"> {s.qualifier}</span>
                  )}
                </h3>
                <p>{s.p}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ══ DIFFERENTIATION ═══════════════════════════════════════════════════════
   ⚠ The left column states facts about identifiable third parties in a
   regulated category. It is in the approved layout so it ships, and it is the
   most complaint-prone block on the page. Emptying
   funnel.difference.typical.items drops the column — the grid then holds one
   child and the right column fills the row. One line, no layout work. */
export function Difference() {
  const showTypical = funnel.difference.typical.items.length > 0

  return (
    <section className="fn-section fn-wrap">
      <p className="fn-eyebrow" style={{ marginBottom: 14 }}>{funnel.difference.tag}</p>
      <h2 style={{ fontSize: 'clamp(30px,4vw,42px)', marginBottom: 44, maxWidth: 560 }}>
        {funnel.difference.h2}
      </h2>

      <div className="fn-diff-grid">
        {showTypical && (
          <div className="fn-diff-col fn-typical">
            <h3>{funnel.difference.typical.h}</h3>
            <ul className="fn-diff-list">
              {funnel.difference.typical.items.map(i => <li key={i}>{i}</li>)}
            </ul>
          </div>
        )}
        <div className="fn-diff-col fn-gwop">
          <h3>{funnel.difference.gwop.h}</h3>
          <ul className="fn-diff-list">
            {funnel.difference.gwop.items.map(i => <li key={i}>{i}</li>)}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ══ FOUNDER ═══════════════════════════════════════════════════════════════ */
export function Founder() {
  return (
    <section className="fn-section fn-section--forest">
      <div className="fn-wrap">
        <p className="fn-eyebrow" style={{ marginBottom: 14 }}>{funnel.founder.tag}</p>
        <h2 style={{ fontSize: 'clamp(30px,4vw,42px)', marginBottom: 44, maxWidth: 560 }}>
          {funnel.founder.h2}
        </h2>
        <div className="fn-person">
          {/* No role label and no name heading — see content/funnel.ts. The
              section h2 above already names him, and "Founder" is the first
              word of the bio. */}
          {funnel.founder.lines.map(l => <p key={l}>{l}</p>)}
          <p className="fn-person-close">{funnel.founder.close}</p>
        </div>
      </div>
    </section>
  )
}

/* ══ TRUST ═════════════════════════════════════════════════════════════════
   Icons use stroke="currentColor" so they inherit the gold from
   .fn-trust-icon svg — that is how the mockup coloured them. */
const TRUST_ICONS: Record<string, ReactNode> = {
  shield: <path d="M12 2 20 6v6c0 6-3.5 9.5-8 11-4.5-1.5-8-5-8-11V6Z" />,
  check: <><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></>,
  calendar: <><rect x="4" y="4" width="16" height="16" rx="1.5" /><path d="M4 9h16" /></>,
}

export function Trust() {
  return (
    <section className="fn-section fn-wrap">
      <p className="fn-eyebrow" style={{ marginBottom: 14 }}>{funnel.trust.tag}</p>
      <h2 style={{ fontSize: 'clamp(30px,4vw,42px)', marginBottom: 44, maxWidth: 560 }}>
        {funnel.trust.h2}
      </h2>

      <div className="fn-trust-icons">
        {funnel.trust.items.map(it => (
          <div className="fn-trust-icon" key={it.h}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              {TRUST_ICONS[it.icon]}
            </svg>
            <h4>{it.h}</h4>
            <p>{it.p}</p>
          </div>
        ))}
      </div>

      {/* Attorney-owned. Through <Tbc> so DRAFT mode flags it while
          legal.disclosure.pending is still true. Never redrafted here. */}
      <div className="fn-legal-box">
        <Tbc>{legal.disclosure.text}</Tbc>{' '}
        Read our <a href="/privacy">Privacy Policy</a>,{' '}
        <a href="/terms">Terms &amp; Conditions</a>, and{' '}
        <a href="/disclosures">Disclosures</a>.
      </div>
    </section>
  )
}

/* ══ VERIFIED RESULTS + TESTIMONIALS ═══════════════════════════════════════
   Two parts, deliberately. The score cards prove it happened; a written quote
   in someone's own voice makes a reader feel it. Numbers alone do not read as
   testimonial, and quotes alone are unverifiable.

   ⚠ THE WHOLE SECTION RETURNS null UNTIL resultsPublishable() PASSES, which
   requires RESULTS.approved, Felicia's disclaimer written, and written consent
   recorded PER INDIVIDUAL. Not a bulk flag — one person withholding consent
   holds the section, which is the correct failure direction for published
   credit results.

   ⚠ NO BUREAU LOGOS AND NO SCREENSHOTS, EVER. Bureau names render as plain
   text in the UI font. The source material was CRM screenshots carrying full
   names, live email addresses and Equifax/TransUnion/Experian marks — logos
   read as endorsement, and a score beside an email is a privacy problem no
   consent form fixes. See the header of content/results.ts.

   The three placeholder quote slots that used to be here are gone. Placeholder
   social proof in a credit funnel is the worst of both worlds: it persuades
   nobody and it is still a claim. */
export function Testimonials() {
  if (!resultsPublishable()) return null

  return (
    <section className="fn-section fn-section--forest">
      <div className="fn-wrap">
        <p className="fn-eyebrow" style={{ marginBottom: 14 }}>{RESULTS.eyebrow}</p>
        <h2 style={{ fontSize: 'clamp(30px,4vw,42px)', marginBottom: 20, maxWidth: 560 }}>
          {RESULTS.h2}
        </h2>

        {/* ⚠ ABOVE THE CARDS, NOT IN THE SMALL PRINT BELOW THEM. Somebody who
            reads the numbers and stops reading has still seen it. Moving this
            under the cards turns an honest section into a claim with a
            footnote. */}
        <p className="fn-lede" style={{ marginBottom: 44 }}>{RESULTS.honestNote}</p>

        <div className="fn-results">
          {RESULTS.cards.map(card => (
            <div className="fn-result" key={card.who}>
              <p className="fn-result-who">
                {card.who}
                {card.timeframe && (
                  <span className="fn-result-when"> &middot; {card.timeframe}</span>
                )}
              </p>

              {/* A real <table>: three bureaus against before/after/change is
                  tabular data and a screen reader should say so. The header row
                  is visually hidden rather than absent — sighted readers get
                  the pattern from the layout, everyone else needs the labels. */}
              <table className="fn-result-rows">
                <caption className="fn-sr">
                  Credit score movement for {card.who} across {card.rows.length} bureaus
                </caption>
                <thead className="fn-sr">
                  <tr>
                    <th scope="col">Bureau</th>
                    <th scope="col">Before</th>
                    <th scope="col">After</th>
                    <th scope="col">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {card.rows.map(r => {
                    /* Both ends are needed for the arrow. A row missing
                       before/after shows the movement alone — accurate, just
                       less vivid. It must never print a number nobody
                       measured, which is why there is no arithmetic here. */
                    const hasSpan = r.before !== null && r.after !== null
                    return (
                      <tr key={r.bureau}>
                        <th scope="row">{r.bureau}</th>
                        {hasSpan ? (
                          <>
                            <td className="fn-result-from">{r.before}</td>
                            <td className="fn-result-to">
                              <span className="fn-result-arrow" aria-hidden="true">→</span>
                              {r.after}
                            </td>
                          </>
                        ) : (
                          /* colSpan keeps the change column aligned with the
                             cards that do have a full span. */
                          <td className="fn-result-nospan" colSpan={2}>
                            {r.after !== null ? <>to {r.after}</> : <>&mdash;</>}
                          </td>
                        )}
                        <td className="fn-result-delta">+{r.delta}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {card.deletions !== null && (
                <p className="fn-result-chip">{card.deletions} items deleted</p>
              )}
            </div>
          ))}
        </div>

        {/* Written quotes, under the numbers. Renders nothing while the array
            is empty — no placeholder state, and consent filtered per quote. */}
        {RESULTS.quotes.length > 0 && (
          <div className="fn-testi-row" style={{ marginTop: 44 }}>
            {RESULTS.quotes.filter(q => q.consent).map(q => (
              <div className="fn-testi" key={q.who}>
                <p>&ldquo;{q.quote}&rdquo;</p>
                <p className="fn-who">— {q.who}</p>
              </div>
            ))}
          </div>
        )}

        {/* Attorney-owned. resultsPublishable() already refuses to render the
            section while this is null. Read from config rather than inlined so
            the wording cannot be edited in JSX. */}
        <p className="fn-result-disclaimer">{RESULTS.disclaimer}</p>
      </div>
    </section>
  )
}

/* ══ FAQ ═══════════════════════════════════════════════════════════════════
   Nine items. The cost answer is assembled from the same
   config/membership.ts values the pathway cards use — a price stated in two
   places from two sources is a price that will eventually disagree with
   itself. */
export function Faq() {
  const range = (() => {
    const a = LEVELS.map(l => l.oneTime).filter((x): x is number => x !== null)
    return a.length ? `${fmtMoney(Math.min(...a))}–${fmtMoney(Math.max(...a))}` : null
  })()
  const sep = separateTotal()
  const saving = sep !== null && BLUEPRINT_BUNDLE.oneTime !== null
    ? sep - BLUEPRINT_BUNDLE.oneTime
    : null

  const costAnswer = funnel.costAnswer
    .replace('{levels}', range ?? 'a price announced soon')
    .replace('{bundle}', priceLabel(BLUEPRINT_BUNDLE.oneTime))
    .replace('{savings}', saving !== null ? fmtMoney(saving) : 'a')
    .replace('{refund}', REFUND_POLICY.text)

  return (
    <section className="fn-section fn-wrap">
      {/* Conditional: `tag` is null now that the heading is "Frequently Asked
          Questions". Rendering the <p> anyway would leave a 14px gap above the
          heading and break its alignment with the sections either side. */}
      {funnel.faq.tag && (
        <p className="fn-eyebrow" style={{ marginBottom: 14 }}>{funnel.faq.tag}</p>
      )}
      <h2 style={{ fontSize: 'clamp(30px,4vw,42px)', marginBottom: 44, maxWidth: 560 }}>
        {funnel.faq.h2}
      </h2>

      <div className="fn-faq">
        {funnel.faq.items.map(item => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            {/* The cost answer restates the refund position. Draft marker
                removed with the offer card's — the policy is approved. */}
            <p>{item.a ?? costAnswer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

/* ══ FOOTER ════════════════════════════════════════════════════════════════
   Legal block only, per the approved screenshot: entity in bold, the
   disclosure, the SMS line, then the five links in gold.

   The mockup's four-column grid — brand, socials, Pathway, University — is not
   ported. That also removes the two links that led nowhere useful: "Student
   area" lands on a login wall a first-time visitor has no account for, and the
   Pathway column was four non-links.

   Links are RELATIVE. The mockup hardcoded https://thegwopblueprint.com/…
   while this app serves those pages from NEXT_PUBLIC_SITE_URL; relative paths
   cannot drift from whichever host is serving the page. */
export function FunnelFooter() {
  return (
    <footer className="fn-foot">
      <div className="fn-wrap fn-foot-legal">
        <p className="fn-foot-entity">{legal.entity.text}</p>
        <p><Tbc>{legal.disclosure.text}</Tbc></p>
        <p>Msg &amp; data rates may apply. Reply STOP to opt out.</p>
        <ul className="fn-foot-links">
          {funnel.footer.legalLinks.map(l => (
            <li key={l.href}><a href={l.href}>{l.label}</a></li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
