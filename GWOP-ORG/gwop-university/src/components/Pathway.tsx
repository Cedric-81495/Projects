import Image from 'next/image'
import Link from 'next/link'
import { PATHWAY } from '@/content/pathway'
import { site } from '@/content/site'
import { EVENT_PATH } from '@/config/integrations'

/* ═══════════════════════════════════════════════════════════════════════════
   VISUAL BUILD PACKAGE p.4 — "WEBSITE + APP VISUAL TARGET"
   Felicia: "build from a visual hierarchy like this — not from scattered copy."

   p.4 shows both uses at once: a marketing hero with START YOUR BLUEPRINT, and
   four cards with ENTER > that lead into levels. One design language, two
   surfaces — which is what the title means by "WEBSITE + APP".

   So the STRUCTURE is shared and identical: black card, gold eyebrow, serif
   headline, supporting line, one emerald pill CTA, artwork on its white plate
   to the right, four cards below. Only the words and the CTA target differ.

   Surfaces are a closed union, not open props. A new surface has to be added
   to SURFACES here, so it inherits the layout and cannot invent its own.
   ═══════════════════════════════════════════════════════════════════════════ */

type Surface = 'website' | 'app'

const SURFACES: Record<Surface, {
  eyebrow: string; h1: string; sub: string; cta: string; href: string
}> = {
  /* Public site. Copy is prescribed by p.4 — do not reword. */
  website: {
    eyebrow: site.hero.eyebrow,
    h1: site.hero.h1,
    sub: site.hero.sub,
    cta: site.hero.primary,
    href: EVENT_PATH,
  },
  /* Student area. Same hierarchy, addressed to someone already enrolled — the
     website's "Start your blueprint → /830" would send a paying student back
     out to the event signup funnel. */
  app: {
    eyebrow: 'Student area',
    h1: 'Your Blueprint',
    sub: site.hero.sub,
    cta: 'Continue',
    href: `/app/${PATHWAY[0].slug}`,
  },
}

export function PathwayTarget({ surface }: { surface: Surface }) {
  const c = SURFACES[surface]

  return (
    <div className="hero wrap">
      {/* ── HERO CARD · p.4 ── */}
      <div className="herocard">
        <div>
          <p className="tag on-dark">{c.eyebrow}</p>
          <h1>{c.h1}</h1>
          <p className="sub">{c.sub}</p>
        </div>

        {/* Artwork on its white plate. Square corners — p.4 shows a plain
            rectangle, so no border-radius here. */}
        <div className="herologo">
          <picture>
            <source srcSet="/hero-crest-600.webp" type="image/webp" />
            <Image
              src="/hero-crest-600.png"
              alt="GWOP University — The GWOP Blueprint"
              width={600}
              height={916}
              priority
              sizes="(max-width:820px) 58vw, 270px"
            />
          </picture>
        </div>

        {/* A DIRECT grid child, not nested in the copy block, so `grid-template-
            areas` can place it after the crest on a phone and beside it on
            desktop. Nesting it made that impossible: CSS cannot reorder an
            element past its parent's sibling.
            Mobile reads copy → crest → CTA, so the button sits at the thumb end
            of the card. Desktop keeps p.4's two-column arrangement. */}
        <div className="acts">
          {/* A PLAIN <a>, not <Link>, when this points at the event page.

              Third-party scripts inject themselves into document.body, outside
              React's tree, so a client-side navigation does not remove them.
              Jake's chat widget is mounted on this page — click through to /830
              with <Link> and the bubble comes along, landing on the one page
              CLAUDE.md invariant 7 keeps every third-party script off.

              That is not hypothetical: it broke the form. The widget loads its
              own copy of Cloudflare Turnstile, the second load bails with
              "Turnstile already has been loaded", our challenge never renders,
              and every submission comes back 422 with "Some fields need
              attention" and no way for the attendee to fix it.

              A hard navigation gives /830 a clean document every time. It costs
              one page load on a path people take once. */}
          {c.href === EVENT_PATH ? (
            <a className="btn btn-e" href={c.href}>{c.cta}</a>
          ) : (
            <Link className="btn btn-e" href={c.href}>{c.cta}</Link>
          )}
        </div>
      </div>

      {/* ── FOUR COURSE CARDS · p.4 ── label, goal, Enter. Identical on both
             surfaces. Module readiness counts are internal and live on /admin. */}
      <div className="courses">
        {PATHWAY.map(l => (
          <Link className="course" href={`/app/${l.slug}`} key={l.slug}>
            <span className="nm">{l.label}</span>
            <span className="goal">{l.goal}</span>
            <span className="enter">Enter ›</span>
          </Link>
        ))}
      </div>
    </div>
  )
}