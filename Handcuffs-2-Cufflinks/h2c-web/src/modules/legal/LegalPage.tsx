import { useReveal } from '@/lib/useReveal';
import { Eyebrow, Reveal } from '@/shared/ui';

const sections = [
  { h: 'Terms of use', b: 'By using this site you agree to browse and shop in good faith. Content, imagery, and the Handcuffs 2 Cufflinks name are the property of the movement and its founder.' },
  { h: 'Privacy', b: 'We collect only what we need to fulfil orders, answer submissions, and send the updates you asked for. We do not sell your data. You can request deletion at any time.' },
  { h: 'Returns', b: '30 days, unworn, tags attached. We pay for the return label on US orders. Made-to-measure tailoring cannot be returned unless it is faulty.' },
  { h: 'Story submissions', b: 'A person reads every submission. If we want to feature it, we contact you first for written permission. Submitting does not guarantee publication, and you can withdraw permission at any time.' },
];

export function LegalPage() {
  useReveal('legal');
  return (
    <section className="sec t-3" style={{ minHeight: '70vh' }}>
      <div className="wrap" style={{ maxWidth: 780 }}>
        <Eyebrow>The fine print</Eyebrow>
        <Reveal as="h2" delay={1} className="h2">Terms, privacy &amp; returns</Reveal>
        <div style={{ marginTop: 20 }}>
          {sections.map((s) => (
            <Reveal key={s.h} className="rise" >
              <div style={{ padding: '24px 0', borderTop: '1px solid var(--rule)' }}>
                <h3 className="h3" style={{ marginBottom: 10 }}>{s.h}</h3>
                <p className="body" style={{ margin: 0, maxWidth: '68ch' }}>{s.b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
