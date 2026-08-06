import { Link } from 'react-router-dom';
import { useReveal } from '@/lib/useReveal';
import { Eyebrow, PhotoWell, Reveal } from '@/shared/ui';

const pillars = [
  { t: 'Mission', d: 'Explain the purpose and symbolism of the movement.' },
  { t: 'Storytelling', d: 'Share real transformation through documentaries, podcast, music, and the founder’s journey.' },
  { t: 'Community', d: 'Invite people to participate and contribute their own stories.' },
  { t: 'Brand expression', d: 'Use apparel as a symbolic way to wear the movement.' },
  { t: 'Ecosystem', d: 'Show how GWOP and Kitchen Muzik extend the movement without overshadowing it.' },
];

export function MovementPage() {
  useReveal('movement');
  return (
    <>
      <section className="sec t-5">
        <div className="wrap">
          <Eyebrow>The movement</Eyebrow>
          <Reveal as="h2" delay={1} className="h2">From limitation<br />to liberation</Reveal>
          <Reveal delay={1} className="lede" as="p">
            Handcuffs 2 Cufflinks represents every journey from pain to purpose, survival to
            success, and struggle to strength. You did not have to spend time in prison to
            make it.
          </Reveal>
        </div>
      </section>

      <section className="sec t-green">
        <div className="wrap means">
          <div>
            <h3 className="h3 rise">Handcuffs</h3>
            <Reveal delay={1} className="body" as="p">
              Whatever held you: incarceration, poverty, addiction, trauma, rejection, fear, a
              bad decision, an environment that wanted you to stay put — or your own doubt.
            </Reveal>
            <h3 className="h3 rise" style={{ marginTop: 34 }}>Cufflinks</h3>
            <Reveal delay={1} className="body" as="p">
              What you build next: growth, freedom, discipline, confidence, ownership,
              leadership, purpose. The French cuff, closed by hand, where the handcuffs used to be.
            </Reveal>
          </div>
          <Reveal delay={2} className="means-pair">
            <figure><PhotoWell src="/assets/look1.jpg" alt="The beginning" ratio="2x3" /><figcaption>Handcuffs</figcaption></figure>
            <figure><PhotoWell src="/assets/look8.jpg" alt="The transformation" ratio="2x3" /><figcaption>Cufflinks</figcaption></figure>
          </Reveal>
        </div>
      </section>

      <section className="sec t-4">
        <div className="wrap">
          <Eyebrow>Five interconnected pillars</Eyebrow>
          <Reveal as="h2" delay={1} className="h2">One central idea</Reveal>
          <div style={{ marginTop: 30, display: 'grid', gap: 1, background: 'var(--rule)' }}>
            {pillars.map((p, i) => (
              <Reveal key={p.t} delay={((i % 3) + 1) as 1 | 2 | 3} className="card-row" >
                <div style={{ background: 'var(--concrete-2)', padding: '26px clamp(16px,3vw,34px)', display: 'flex', gap: 'clamp(14px,3vw,40px)', alignItems: 'baseline', width: '100%' }}>
                  <span className="chip-num" style={{ fontSize: '1.4rem', minWidth: 40 }}>0{i + 1}</span>
                  <div>
                    <h3 className="card-name" style={{ fontSize: '1.5rem', marginBottom: 6 }}>{p.t}</h3>
                    <p className="body" style={{ margin: 0 }}>{p.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={1} className="btn-row"><Link className="btn btn--gold" to="/join" style={{ marginTop: 40 }}>Join the movement</Link></Reveal>
        </div>
      </section>
    </>
  );
}
