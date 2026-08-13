import Link from 'next/link'
import type { Metadata } from 'next'
import { PATHWAY } from '@/content/pathway'
import { byLevel } from '@/content/modules'
import { site } from '@/content/site'
import { Nav, Footer, DraftBar } from '@/components/Chrome'

export const metadata: Metadata = { title: 'Student Area — GWOP University' }

/* Student app — same card system as the website (p.2 team rule).
   UI only. Auth + real content are Phase 2 (CLAUDE.md §3). */
export default function StudentHome() {
  return (
    <>
      <Nav />
      <section>
        <div className="wrap">
          <div className="head">
            <p className="tag">Student Area</p>
            <h2 className="h2">Your Blueprint</h2>
            <p className="lede">{site.hero.sub}</p>
          </div>

          <div className="courses">
            {PATHWAY.map(l => {
              const mods = byLevel(l.slug)
              const ready = mods.filter(m => m.status === 'ready').length
              return (
                <Link className="course" href={`/app/${l.slug}`} key={l.slug}>
                  <span className="nm">{l.label}</span>
                  <span className="goal">{l.goal}</span>
                  <span className="enter">
                    {ready}/{mods.length} ready · Enter ›
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
      <Footer />
      <DraftBar pending="module content (Maui + Sheena), student sign-in (Phase 2)" />
    </>
  )
}
