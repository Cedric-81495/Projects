import { Seo } from '@/lib/seo/Seo';
import { PageHero } from '@/components/layout/PageHero';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Section, Wrap, Band } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ButtonLink, Row } from '@/components/ui/Button';
import { Note } from '@/components/ui/Note';
import { PROGRAMMES as PROGRAMMES_SEED } from '@/data/gwop';
import { ECOSYSTEM } from '@/config/site';
import { ROUTES } from '@/router/routes';
import { SectionLoad } from '@/components/ui/Spinner';
import { useContent } from '@/lib/api/useContent';
import { toProgramme } from '@/lib/content/adapters';
import type { ApiProgramme } from '@/lib/content/adapters';

/**
 * GWOP is the education and empowerment arm. It gets its own crest, its own
 * attribution label, and a distinctly cooler, more institutional register than
 * the parent brand's storytelling voice.
 */
export function GwopPage() {
  const { items: PROGRAMMES, loading } = useContent<ApiProgramme, (typeof PROGRAMMES_SEED)[number]>(
    '/gwop/programmes',
    toProgramme,
    PROGRAMMES_SEED
  );

  return (
    <>
      <Seo
        title="GWOP"
        description="Education, mentorship, and community development within the Handcuffs 2 Cufflinks ecosystem."
        canonicalPath={ROUTES.gwop}
      />
      <Breadcrumb trail={[{ label: 'Home', to: ROUTES.home }, { label: 'GWOP' }]} />
      <PageHero
        eyebrow="GWOP · get with our plan"
        title="Learn the way out"
        lede="GWOP is the teaching arm of the movement. GWOP University takes the money side in the order it actually needs to happen — mindset first, then credit, banking, funding readiness, structure and ownership."
      />

      <Section surface="charcoal" tight>
        <Wrap>
          <div className="split split--top">
            <div>
              <Eyebrow>What GWOP does</Eyebrow>
              <h2 className="h-md rise d1">Order, not motivation</h2>
              <p className="body rise d2">
                Information about money is everywhere. The order is not. GWOP University exists to
                connect the dots — what applies to you, what to fix first, and what happens after
                you finally get access to capital.
              </p>
              <p className="body rise d2">
                Four levels, taken in sequence. Freshman builds the foundation, Sophomore gets you
                ready, Junior builds and scales, Senior is about legacy. It starts with how you
                think about money rather than where to apply for it, because structure is what
                lenders are actually reading.
              </p>
              <p className="body rise d2">
                And money is not the whole conversation. Financial stress does not stay in a bank
                account — it follows people home. The programme is built for the whole person.
              </p>
              <p className="body rise d2">
                Alongside the levels there is the Blueprint one-to-one: an hour with Beast walking
                through your own roadmap, rather than a course telling everybody the same thing.
              </p>
              <Row className="rise d3">
                <ButtonLink to={ROUTES.community} variant="ghost" icon="arrow">
                  Get involved
                </ButtonLink>
              </Row>
            </div>
            <div className="rise d2">
              <img
                src="/media/crest-gwop-university.webp"
                alt="GWOP University crest"
                /**
                 * 128 rather than 220: the crest is supplied at 232x256, and a
                 * retina screen draws twice the CSS size — so anything above
                 * 128 is upscaled and the lettering in the banner goes soft.
                 * Raise this the moment a larger export exists.
                 */
                style={{ maxWidth: 128 }}
                loading="lazy"
              />
            </div>
          </div>
        </Wrap>
      </Section>

      <Section surface="charcoal-hi">
        <Wrap>
          <Eyebrow>Current programmes</Eyebrow>
          <h2 className="h-lg rise d1">What is running now</h2>

          <div className="g3 rise d2" style={{ marginTop: 'clamp(26px,3vw,44px)' }}>
            {loading ? <SectionLoad label="Loading programmes" /> : PROGRAMMES.map((programme) => (
              <article key={programme.name} className="eco-card" style={{ border: '1px solid var(--rule)' }}>
                <p className="eco-role">
                  {programme.kind} · {programme.len}
                </p>
                <h3>{programme.name}</h3>
                <p>{programme.note}</p>
              </article>
            ))}
          </div>
        </Wrap>
      </Section>

      <Band direction="to-emerald" />

      <Section surface="emerald">
        <Wrap narrow>
          <Note label={ECOSYSTEM.gwop.attribution}>
            GWOP operates within the Handcuffs 2 Cufflinks ecosystem with its own programmes,
            enrolment, and reporting.
          </Note>
          <Row className="rise" style={{ marginTop: 'clamp(24px,3vw,38px)' }}>
            <ButtonLink to={ROUTES.join} variant="gold" icon="arrow">
              Join the Movement
            </ButtonLink>
          </Row>
        </Wrap>
      </Section>
    </>
  );
}
