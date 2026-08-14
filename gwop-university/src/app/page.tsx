import Image from 'next/image'
import Link from 'next/link'
import { site } from '@/content/site'
import { PATHWAY, CAPSTONE } from '@/content/pathway'
import { EVENT_PATH } from '@/config/integrations'
import { Nav, Footer, DraftBar } from '@/components/Chrome'

/* Strictly Visual Build Package p.5 (hero + four course cards) and
   p.4 (the 4-level pathway). No sections the package does not specify. */
export default function Home() {
  return (
    <>
      <Nav />

      {/* ═══ HERO · p.5 — copy AND layout prescribed, do not reword or add ═══
          Package p.5 shows exactly one button. A second CTA next to the primary
          splits the one action the page is meant to drive, so there is one. */}
      <div className="hero wrap">
        <div className="herocard">
          <div>
            <p className="tag on-dark">{site.hero.eyebrow}</p>
            <h1>{site.hero.h1}</h1>
            <p className="sub">{site.hero.sub}</p>
            <div className="acts">
              <Link className="btn btn-e" href={EVENT_PATH}>{site.hero.primary}</Link>
            </div>
          </div>

          {/* The ornate Blueprint artwork, on the right, as p.5 shows it.
              Background cut so it sits on the dark card without a white plate. */}
          <div className="herologo">
            <picture>
              <source srcSet="/hero-crest-600.webp" type="image/webp" />
              <Image
                src="/hero-crest-600.png"
                alt="GWOP University — The GWOP Blueprint"
                width={600}
                height={932}
                priority
                sizes="(max-width:820px) 58vw, 270px"
              />
            </picture>
          </div>
        </div>

        {/* ═══ FOUR COURSE CARDS · p.5 ═══ */}
        <div className="courses">
          {PATHWAY.map(l => (
            <Link className="course" href={`/app/${l.slug}`} key={l.slug}>
              <span className="nm">{l.label}</span>
              <span className="goal">{l.goal}</span>
              <span className="enter">Enter ›</span>
            </Link>
          ))}
        </div>

        <p className="buildnote">{site.courseNote}</p>
      </div>

      {/* ═══ PATHWAY · p.4 ═══ */}
      <section id="pathway">
        <div className="wrap">
          <div className="head mid">
            <p className="orn"><i /></p>
            <p className="tag">{site.pathway.tag}</p>
            <h2 className="h2">{site.pathway.h2}</h2>
            <p className="lede">{site.pathway.lede}</p>
          </div>

          <div className="path">
            {PATHWAY.map((l, i) => (
              <div key={l.slug}>
                <div className={`bar ${i % 2 === 0 ? 'g' : 'k'}`}>
                  <span className="n">{l.n}</span>
                  <div>
                    <h3>{l.label}</h3>
                    <p className="role">{l.role}</p>
                  </div>
                  <p className="det">{l.detail}</p>
                </div>
                {i < PATHWAY.length - 1 && <div className="link" />}
              </div>
            ))}
          </div>

          <p className="capstone">{CAPSTONE}</p>
        </div>
      </section>

      {/* ═══ CTA · p.5 build note: "strong CTA" ═══ */}
      <div className="cta-band">
        <div className="wrap">
          <hr />
          <h2>{site.cta.h2}</h2>
          <p>{site.cta.p}</p>
          <Link className="btn btn-g" href={EVENT_PATH}>{site.cta.button}</Link>
        </div>
      </div>

      <Footer />
      <DraftBar pending="pricing, legal copy (attorney), Jake's form URL" />
    </>
  )
}
