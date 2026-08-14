import { BrandBar, Footer } from '@/components/Chrome'
import { REFUND_POLICY } from '@/config/membership'

/* Felicia §13 — a required placeholder route: "Refund / Cancellation Policy".
   Felicia §1: "Do not publish a final policy until approved." So this route
   exists and is linkable, but renders nothing but a holding line until
   REFUND_POLICY.approved is true. */
export default function Page() {
  return (
    <>
      <BrandBar />
      <section>
        <div className="wrap">
          <div className="head">
            <p className="tag">Legal</p>
            <h2 className="h2">Refund &amp; Cancellation</h2>
            {REFUND_POLICY.approved && REFUND_POLICY.text ? (
              <p className="lede">{REFUND_POLICY.text}</p>
            ) : (
              <p className="lede" data-tbc>
                Pending approval. No refund or cancellation terms are published yet, and
                none are in force until this page carries approved wording.
              </p>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}
