import { BrandBar, Footer } from '@/components/Chrome'
import { legal } from '@/content/site'

/* Felicia §13 — a required placeholder route: "SMS Terms / Consent language".
   ⚠️ ATTORNEY-SUPPLIED COPY ONLY. Do not draft. The one line below is the
   carrier-mandated consent disclosure Jake's A2P registration already runs on,
   so it is quoted, not written here — it lives in src/content/site.ts. */
export default function Page() {
  return (
    <>
      {/* Unlinked bar and legal-only footer: an attendee reaches this page
          mid-signup from the /830 consent wording, and every route out of it —
          Sign In, the Pathway levels, the Student area — leads to a login wall
          they have no account for. The page itself must stay readable; the ways
          off it must not exist. Invariant 10. */}
      <BrandBar linked={false} />
      <section>
        <div className="wrap">
          <div className="head">
            <p className="tag">Legal</p>
            <h2 className="h2">SMS Terms &amp; Consent</h2>
            <p className="lede" data-tbc>
              Awaiting the client attorney&rsquo;s approved text. Paste the supplied
              document here verbatim.
            </p>
            <p className="lede">{legal.sms}</p>
          </div>
        </div>
      </section>
      <Footer legalOnly />
    </>
  )
}
