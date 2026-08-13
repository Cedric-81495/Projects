import type { Metadata } from 'next'
import Link from 'next/link'
import { event } from '@/content/event'
import { site, legal } from '@/content/site'
import { PATHWAY, CAPSTONE } from '@/content/pathway'

import { Crest, DraftBar, Tbc } from '@/components/Chrome'
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
      <div className="evbar">
        <Crest size={34} />
        <b>
          {site.brand}
          <small>{site.motto}</small>
        </b>
      </div>

      {/* ═══ HERO · Visual Build Package p.7 ═══ */}
      <div className="evhero">
        <div className="evcard">
          <span className="evtag" data-tbc>{event.badge.text}</span>
          <h1>
            {event.h1a}
            <em>{event.h1b}</em>
          </h1>
          <p className="evkw">{event.kicker}</p>
          <a className="btn btn-e" href="#choose" style={{ marginTop: 26 }}>
            {event.cta}
          </a>
          <p className="evfine">{event.fine}</p>
        </div>
      </div>

      <div className="wrap">
        {/* ═══ INCENTIVE ═══ */}
        <section className="evsect">
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

        {/* ═══ PATHWAY · task 2 ═══ */}
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

      {/* ═══ CLOSING ═══ */}
      <div className="evclosing">
        <h2>{site.hero.h1}</h2>
        <p>Get your free blueprint before you leave the table.</p>
        <a className="btn btn-g" href="#choose">{event.cta}</a>
      </div>

      <footer className="evfoot">
        <p><strong><Tbc>{legal.entity.text}</Tbc></strong></p>
        <p><Tbc>{legal.disclosure.text}</Tbc></p>
        <p>
          Msg &amp; data rates may apply. Reply STOP to opt out.{' '}
          <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link>
        </p>
      </footer>

      <DraftBar pending="founding member wording (Surpaul), Wellness interest (Felicia), legal copy (attorney), Jake's form URL" />
    </div>
  )
}
