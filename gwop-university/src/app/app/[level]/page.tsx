import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PATHWAY } from '@/content/pathway'
import { byLevel } from '@/content/modules'
import { BrandBar, Footer } from '@/components/Chrome'

export function generateStaticParams() {
  return PATHWAY.map(l => ({ level: l.slug }))
}

export default async function LevelPage(
  { params }: { params: Promise<{ level: string }> },
) {
  const { level } = await params
  const meta = PATHWAY.find(l => l.slug === level)
  if (!meta) notFound()

  const mods = byLevel(level)

  return (
    <>
      <BrandBar />
      <section>
        <div className="wrap">
          <p className="crumb"><Link href="/app">Student area</Link> › {meta.label}</p>

          <div className="head">
            <p className="tag">{meta.label} · {meta.role}</p>
            <h2 className="h2">{meta.goal}</h2>
            <p className="lede">{meta.detail}</p>
          </div>

          <div className="mods">
            {mods.map(m => (
              <Link
                className="mod"
                href={`/app/${level}/${m.slug}`}
                key={m.slug}
                data-locked={m.status !== 'ready'}
              >
                <span className="mn">{String(m.order).padStart(2, '0')}</span>
                <span>
                  <h3>{m.title}</h3>
                  {/* Internal production status ("In production", "Missing
                      assets") stays on /admin. A student sees the runtime and
                      whether it is open yet — nothing about our pipeline. */}
                  <span className="meta">{m.minutes} min</span>
                </span>
                <span className="go">{m.status === 'ready' ? 'Open ›' : 'Soon'}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}
