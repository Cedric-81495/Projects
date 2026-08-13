import type { Metadata } from 'next'
import { event } from '@/content/event'
import { site } from '@/content/site'
import { Crest, DraftBar, Tbc } from '@/components/Chrome'

export const metadata: Metadata = {
  title: "You're in — GWOP University",
  robots: { index: false, follow: false },
}

/* Tracker task 5. Reached after Jake's form submits.
   ⚠️ Depends on Jake's GHL form being able to redirect here — confirm with him. */
export default function Thanks() {
  return (
    <div className="ev">
      <div className="evbar">
        <Crest size={34} />
        <b>{site.brand}<small>{site.motto}</small></b>
      </div>

      <div className="evhero">
        <div className="evcard">
          <span className="evtag">Signup complete</span>
          <h1>{event.thanks.h1}</h1>
          <p className="evkw" style={{ fontWeight: 400 }}>{event.thanks.lede}</p>
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
        </section>
      </div>

      <DraftBar pending="founding member wording (Surpaul), GHL redirect confirmation (Jake)" />
    </div>
  )
}
