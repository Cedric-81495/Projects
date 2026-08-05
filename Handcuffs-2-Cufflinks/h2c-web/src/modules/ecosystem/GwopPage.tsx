import { useReveal } from '@/lib/useReveal';
import { Eyebrow, PhotoWell, Reveal } from '@/shared/ui';

const facets = [
  { t: 'Ownership', d: 'Equity over wages. The difference between working in it and owning it.' },
  { t: 'Opportunity', d: 'Doors that open for people who were told theirs were closed.' },
  { t: 'Education', d: 'The practical literacy — money, systems, leverage — nobody taught first time round.' },
  { t: 'Growth', d: 'Compounding, not sprinting. Slow and owned beats fast and borrowed.' },
];

export function GwopPage() {
  useReveal('gwop');
  return (
    <>
      <section className="sec t-light" style={{ paddingBottom: 0 }}>
        <div className="wrap means">
          <div>
            <Eyebrow>The ecosystem · a connected brand</Eyebrow>
            <Reveal as="h2" delay={1} className="h2">GWOP</Reveal>
            <Reveal delay={1} className="pull" as="p">The step after the story.</Reveal>
            <Reveal delay={2} className="body" as="p">
              GWOP is a separate business under the same founder, focused on ownership,
              opportunity, education, and financial growth. Handcuffs 2 Cufflinks tells the
              story; GWOP is what you build once you have decided to change it. The two connect —
              GWOP does not overshadow the movement, it extends it.
            </Reveal>
          </div>
          <Reveal delay={2}>
            <PhotoWell src="/assets/gwop.webp" alt="GWOP" ratio="4x5" warm={false} />
          </Reveal>
        </div>
      </section>

      <section className="sec t-light" style={{ paddingTop: 'clamp(30px,4vw,54px)' }}>
        <div className="wrap">
          <div className="grid4">
            {facets.map((f, i) => (
              <Reveal key={f.t} delay={((i % 4) + 1) as 1 | 2 | 3} >
                <div style={{ borderTop: '2px solid var(--brass-deep)', paddingTop: 18 }}>
                  <h3 className="card-name" style={{ fontSize: '1.4rem', marginBottom: 8 }}>{f.t}</h3>
                  <p className="body" style={{ margin: 0 }}>{f.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
