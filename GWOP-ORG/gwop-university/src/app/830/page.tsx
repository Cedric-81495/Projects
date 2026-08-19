import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { event } from '@/content/event'
import { site, legal } from '@/content/site'
import { PATHWAY, CAPSTONE } from '@/content/pathway'

import { BrandBar, Tbc } from '@/components/Chrome'
import { InterestForm } from './InterestForm'

/* Event page must never be indexed — CLAUDE.md invariant 11 */
export const metadata: Metadata = {
  title: 'Build Your GWOP Blueprint — Aug 30',
  description: event.kicker,
  robots: { index: false, follow: false },
}



export default function EventPage() {

  return (
    <div className="ev">
      {/* brand identity only — no nav, nothing to click away to (invariant 10) */}
      <BrandBar linked={false} />

      {/* ═══ HERO · Visual Build Package p.7 ═══
          p.7 puts the artwork BESIDE the black card, not inside it. So the grid
          lives on .evhero and the card is one cell — my previous attempt made
          .evcard itself the grid, which threw the kicker into the crest column.
          Removed per Jhon's review: the event badge and the "Free · 2 minutes"
          line. Neither is in p.7, and both push the CTA further down a phone. */}
      <div className="evhero">
        <div className="evcard">
          <h1>
            {event.h1a}
            <em>{event.h1b}</em>
          </h1>
          <p className="evkw">{event.kicker}</p>

          {/* Felicia §2 supporting copy */}
          <p className="evsupport">{event.support}</p>

          <a className="btn btn-e" href="#choose" style={{ marginTop: 26 }}>
            {event.cta}
          </a>

          {/* Felicia §3 — renders only once she confirms time/location.
              Empty values render nothing rather than an empty label. */}
          {(event.details.time.text || event.details.location.text) && (
            <p className="evmeta">
              {[event.details.time.text, event.details.location.text]
                .filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {/* p.7: the artwork sits in its own panel to the right of the card */}
        <div className="evcrest">
          <picture>
            <source srcSet="/hero-crest-400.webp" type="image/webp" />
            <Image
              src="/hero-crest-400.png"
              alt="GWOP University — The GWOP Blueprint"
              width={400}
              height={610}
              /* Must track the CSS above: the crest is a full-width band on
                 mobile now, not a 42vw inset. A stale `sizes` makes Next pick
                 a source narrower than the box and the artwork renders soft. */
              sizes="(max-width:399px) 62vw, (max-width:719px) 72vw, 210px"
            />
          </picture>
        </div>
      </div>

      <div className="wrap">
        {/* ═══ INCENTIVE · Felicia §2 "explain the event incentive" ═══ */}
        <section className="evsect" id="gifts">
          <p className="tag">What you get today</p>
          <h2>{event.incentives.h2}</h2>
          <p className="evlede">{event.incentives.lede}</p>

          <div className="evgifts">
            {event.incentives.items.map((g, i) => (
              <div className="evgift" key={g.h}>
                <span className="num">{i + 1}</span>
                <div>
                  <h3>{g.h}</h3>
                  <p><Tbc>{g.p}</Tbc></p>
                </div>
              </div>
            ))}
          </div>

          <div className="evabout">
            <h2>{event.about.h2}</h2>
            {event.about.lines.map(l => <p key={l}>{l}</p>)}
          </div>
        </section>

        {/* ═══ CHOOSE → CAPTURE · p.6 ═══ */}
        <section className="evsect" id="choose">
          <p className="tag">{event.choose.step}</p>
          <h2>{event.choose.h2}</h2>
          <p className="evlede">{event.choose.lede}</p>
          <InterestForm />
        </section>

        {/* ═══ FOUR LEVELS · Felicia §2 "show the four levels" ═══ */}
        <section className="evsect pb">
          <p className="tag">The pathway</p>
          <h2>Four levels, in order.</h2>
          <p className="evlede">Each one has a clear purpose and a clear outcome.</p>

          <div className="evlevels">
            {PATHWAY.map(l => (
              <div className="evlvl" key={l.slug}>
                <div className="nm">{l.label} · {l.role}</div>
                <div className="goal">{l.goal}</div>
                <div className="det">{l.detail}</div>
              </div>
            ))}
          </div>

          <div className="evcap">
            <p className="k">Capstone</p>
            <p>{CAPSTONE.replace('Capstone: ', '')}</p>
          </div>
        </section>
      </div>

      <footer className="evfoot">
        <p><strong><Tbc>{legal.entity.text}</Tbc></strong></p>
        <p><Tbc>{legal.disclosure.text}</Tbc></p>
        <p>
          Msg &amp; data rates may apply. Reply STOP to opt out.{' '}
          <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link> ·{' '}
          <Link href="/sms-terms">SMS Terms</Link>
        </p>
      </footer>
    </div>
  )
}