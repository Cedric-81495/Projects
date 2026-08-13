import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PATHWAY } from '@/content/pathway'
import { MODULES, byLevel } from '@/content/modules'
import { Nav, Footer, DraftBar } from '@/components/Chrome'

export function generateStaticParams() {
  return MODULES.map(m => ({ level: m.level, module: m.slug }))
}

/* Module view. Workbook panel is Visual Build Package p.3, verbatim structure. */
export default async function ModulePage(
  { params }: { params: Promise<{ level: string; module: string }> },
) {
  const { level, module } = await params
  const meta = PATHWAY.find(l => l.slug === level)
  const mod = byLevel(level).find(m => m.slug === module)
  if (!meta || !mod) notFound()

  return (
    <>
      <Nav />
      <section>
        <div className="wrap">
          <p className="crumb">
            <Link href="/app">Student area</Link> ›{' '}
            <Link href={`/app/${level}`}>{meta.label}</Link> › {mod.title}
          </p>

          <div className="head">
            <p className="tag">{meta.label} {String(mod.order).padStart(2, '0')}</p>
            <h2 className="h2">{mod.title}</h2>
            <p className="lede">{mod.minutes} minutes · {meta.detail}</p>
          </div>

          <div className="player" data-tbc>
            Video loads here — awaiting Maui &amp; Sheena&rsquo;s upload
          </div>

          {/* ═══ WORKBOOK · package p.3 ═══ */}
          <div className="wb" style={{ marginTop: 26, maxWidth: 460 }}>
            <div className="wh">
              <p className="lv">{meta.label} {String(mod.order).padStart(2, '0')}</p>
              <h3>{mod.title}</h3>
            </div>
            <div className="wbody">
              <h4>Your Credit Snapshot</h4>
              {['Creditor / Account', 'Balance / Limit', 'Status', 'Next Action'].map(f => (
                <div className="frow" key={f}><b>{f}</b><div className="ln" /></div>
              ))}
              <div className="moves">
                <h4>My Next 3 Moves</h4>
                {[1, 2, 3].map(n => (
                  <div className="move" key={n}>
                    <span className="mvn">{n}</span><span className="ln" />
                  </div>
                ))}
              </div>
              <p className="ak">Action › Knowledge</p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
      <DraftBar pending="video files (Maui + Sheena), student sign-in (Phase 2)" />
    </>
  )
}
