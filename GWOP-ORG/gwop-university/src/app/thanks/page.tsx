import type { Metadata } from 'next'
import Link from 'next/link'
import { event } from '@/content/event'
import { site } from '@/content/site'
import { BOOKING_URL } from '@/config/integrations'
import { BrandBar, Tbc } from '@/components/Chrome'

export const metadata: Metadata = {
  title: "You're in — GWOP University",
  robots: { index: false, follow: false },
}

/* Tracker task 5. Reached after Jake's form submits.
   ⚠️ Depends on Jake's GHL form being able to redirect here — confirm with him. */
export default function Thanks() {
  return (
    <div className="ev ev-thanks">
      <BrandBar />

      {/* Hierarchy prescribed by Felicia §11: YOU'RE IN → Blueprint starts here
          → confirm delivery → next CTA. Do not reorder. */}
      <div className="evhero">
        <div className="evcard">
          <span className="evtag">Signup complete</span>
          <h1>{event.thanks.h1}</h1>
          <p className="evkw">{event.thanks.h2}</p>
          <p className="evsupport">{event.thanks.lede}</p>

          <div className="evacts">
            <Link className="btn btn-e" href={event.thanks.ctas.primary.href}>
              {event.thanks.ctas.primary.label}
            </Link>
            {!event.thanks.ctas.secondary.pending && (
              <a className="btn btn-ol" href={event.thanks.ctas.secondary.href}>
                {event.thanks.ctas.secondary.label}
              </a>
          )}
          </div>
        </div>
      </div>

      <div className="wrap">
        <section className="evsect pb">
          <p className="tag">What happens next</p>
          <h2>Three things.</h2>
          <p className="evlede">In the next few minutes, and before you leave the table.</p>

          <div className="evgifts">
            {event.thanks.next.map((n, i) => (
              <div className="evgift" key={n.h}>
                <span className="num">{i + 1}</span>
                <div>
                  <h3>{n.h}</h3>
                  <p>{'pending' in n ? <Tbc>{n.p}</Tbc> : n.p}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Beast's 1:1 Blueprint calendar — hidden until Jake supplies the
              live GHL booking link. A visible-but-dead button at a booth is
              worse than no button. */}
          {BOOKING_URL && (
            <div className="evcap" style={{ marginTop: 18 }}>
              <p className="k">{event.thanks.booking.h}</p>
              <p style={{ fontWeight: 400, fontSize: 15, marginBottom: 14 }}>
                {event.thanks.booking.p}
              </p>
              <a className="btn btn-g" href={BOOKING_URL}>
                {event.thanks.booking.label}
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
