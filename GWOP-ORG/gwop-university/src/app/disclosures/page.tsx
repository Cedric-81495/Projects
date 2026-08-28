import { BrandBar, Footer } from '@/components/Chrome'

/* ⚠️ ATTORNEY-SUPPLIED COPY ONLY — CLAUDE.md invariant 6. Do not draft. */
export default function Page() {
  return (
    <>
      {/* Unlinked bar and legal-only footer: an attendee reaches this page
          mid-signup from the /830 consent wording, and every route out of it —
          Sign In, the Pathway levels, the Student area — leads to a login wall
          they have no account for. The page itself must stay readable; the ways
          off it must not exist. Invariant 10.
          Brought into line with /privacy, /terms and /sms-terms on 2026-08-27:
          these two were the only legal routes still shipping the linked bar and
          the live footer. */}
      <BrandBar linked={false} />
      <section>
        <div className="wrap">
          <div className="head">
            <p className="tag">Legal</p>
            <h2 className="h2">Disclosures</h2>
          </div>
        </div>
      </section>
      <Footer legalOnly />
    </>
  )
}
