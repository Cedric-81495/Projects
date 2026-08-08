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
        eyebrow="GWOP · education and empowerment"
        title="Learn the way out"
        lede="GWOP is the teaching arm of the movement. Courses, workshops, mentorship, and youth programmes — practical, in person, and free to the community."
      />

      <Section surface="charcoal" tight>
        <Wrap>
          <div className="split split--top">
            <div>
              <Eyebrow>What GWOP does</Eyebrow>
              <h2 className="h-md rise d1">Programmes, not platitudes</h2>
              <p className="body rise d2">
                Every programme exists because somebody in the movement needed it and could not find
                it. Money, paperwork, resumes, licensing, the first ninety days after release, and a
                consistent adult for young people who do not have one.
              </p>
              <Row className="rise d3">
                <ButtonLink to={ROUTES.community} variant="ghost" icon="arrow">
                  Volunteer or mentor
                </ButtonLink>
              </Row>
            </div>
            <div className="rise d2">
              <img
                src="/media/crest-gwop-university.webp"
                alt="GWOP University crest"
                style={{ maxWidth: 220 }}
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
