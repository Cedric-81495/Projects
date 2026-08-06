import { Link } from 'react-router-dom';
import { useReveal } from '@/lib/useReveal';
import { faq } from '@/data';
import { Eyebrow, PhotoWell, Reveal } from '@/shared/ui';
import { useState } from 'react';

export function AboutPage() {
  useReveal('about');
  return (
    <>
      <section className="sec t-paper" style={{ paddingBottom: '50px' }}>
        <div className="wrap means">
          <Reveal delay={1}><PhotoWell src="/assets/founder.jpg" alt="The founder" ratio="4x5" /></Reveal>
          <div>
            <Eyebrow>The founder · authority through experience</Eyebrow>
            <Reveal as="h2" delay={1} className="h2">One of them<br />walked in.</Reveal>
            <Reveal delay={2} className="body" as="p">
              Handcuffs 2 Cufflinks did not begin as a brand. It began as one person&apos;s arc
              from limitation to ownership. Some people grow up looking at the Boston skyline
              from the outside. This is what happens when one of them decides to walk into it —
              and leaves the door open behind him.
            </Reveal>
            <Reveal delay={2} className="body" as="p">
              The founder built the movement so the path would be visible to the next person:
              the story first, then the apparel to wear it, then GWOP to own it.
            </Reveal>
            <Reveal delay={3} className="btn-row"><Link className="btn btn--ghost" to="/movement">What the movement means</Link></Reveal>
          </div>
        </div>
      </section>

      <section className="sec t-3">
        <div className="wrap">
          <Eyebrow>Questions</Eyebrow>
          <Reveal as="h2" delay={1} className="h2">Straight answers</Reveal>
          <div style={{ marginTop: 26, borderTop: '1px solid var(--rule)' }}>
            {faq.map((item) => <FaqRow key={item.q} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>
    </>
  );
}

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rise" style={{ borderBottom: '1px solid var(--rule)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', padding: '22px 0', textAlign: 'left' }}
      >
        <span className="card-name" style={{ fontSize: '1.15rem' }}>{q}</span>
        <span className="chip-num" style={{ fontSize: '1.4rem', transform: open ? 'rotate(45deg)' : 'none', transition: 'transform .3s' }}>+</span>
      </button>
      {open && <p className="body" style={{ margin: '0 0 22px' }}>{a}</p>}
    </div>
  );
}
