import { BrandBar, Footer } from '@/components/Chrome'
import type { Block, LegalDoc } from '@/content/legal-pages'
import '@/styles/legal.css'

/* ══ LEGAL DOCUMENT RENDERER ════════════════════════════════════════════════
   One component for /privacy, /terms and /disclosures. Content comes from
   content/legal-pages.ts so replacement copy never requires touching markup.

   ⚠ BrandBar linked={false} AND Footer legalOnly ARE NOT STYLING CHOICES.
   Invariant 10. Somebody reaches these pages mid-signup from the consent
   wording on /830, with no account. Every ordinary route out — Sign In, the
   Pathway levels, the Student area — ends at a login wall they cannot pass.
   The page has to be readable; the ways off it must not exist.

   ⚠ AND THIS SEGMENT MUST RENDER PER REQUEST. middleware.ts issues a
   per-request CSP nonce, and Next only stamps it onto script tags when the
   page is rendered per request. A statically rendered page under that
   middleware has every script blocked — which is what silently removed the
   password toggle and the Turnstile widget from /signup until 2026-09-11.
   These pages carry no client components today, so nothing visible breaks,
   but that is luck rather than design and it changes the moment one is added.
   Each page sets `export const dynamic = 'force-dynamic'`. */

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.t === 'p') return <p key={i}>{b.text}</p>
        if (b.t === 'note') return <p className="lgl-note" key={i}>{b.text}</p>
        if (b.t === 'ul') {
          return (
            <ul key={i}>
              {b.items.map((it, j) => <li key={j}>{it}</li>)}
            </ul>
          )
        }
        /* A description list rather than a table: these are label/explanation
           pairs, and a two-column table at 380px either scrolls sideways or
           crushes the second column to two words per line. */
        return (
          <dl className="lgl-dl" key={i}>
            {b.rows.map((r, j) => (
              <div className="lgl-row" key={j}>
                <dt>{r.k}</dt>
                <dd>{r.v}</dd>
              </div>
            ))}
          </dl>
        )
      })}
    </>
  )
}

export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <BrandBar linked={false} />
      <section className="lgl-sect">
        <div className="wrap">
          <div className="lgl-head">
            <p className="tag">{doc.tag}</p>
            <h1 className="lgl-title">{doc.title}</h1>
            <p className="lgl-lede">{doc.lede}</p>
            <p className="lgl-updated">Last updated {doc.updated}</p>
          </div>

          <div className="lgl-body">
            {doc.sections.map((s, i) => (
              <section className="lgl-block" key={i}>
                <h2>{s.h}</h2>
                <Blocks blocks={s.blocks} />
              </section>
            ))}

            {doc.footnote && <p className="lgl-foot">{doc.footnote}</p>}
          </div>
        </div>
      </section>
      <Footer legalOnly />
    </>
  )
}
