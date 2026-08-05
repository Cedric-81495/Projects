import { Link } from 'react-router-dom';

export function Hero() {
  return (
    <section className="hero-art" id="top" style={{ background: '#05060A', paddingBottom: 'clamp(34px,5vw,66px)' }}>
      <h1 className="sr">Handcuffs 2 Cufflinks — From Struggle to Success</h1>

      <div style={{ position: 'relative', paddingTop: 'clamp(56px,7vw,92px)' }}>
        <img
          src="/assets/hero.jpg"
          width={1610}
          height={977}
          decoding="async"
          fetchPriority="high"
          alt="Handcuffs 2 Cufflinks. From Struggle to Success. Chrome lettering with a gold two, above the Boston skyline and the Zakim Bridge at night reflected in the harbour, on dark green marble."
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%', pointerEvents: 'none',
            background: 'linear-gradient(180deg,transparent 0%,rgba(5,6,10,.55) 55%,#05060A 100%)',
          }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(10px,2vw,26px) var(--gut) 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p className="hero-support" style={{ maxWidth: '52ch', margin: '0 auto clamp(24px,3vw,34px)' }}>
          A global movement built for people who refused to remain trapped by their past,
          circumstances, mistakes, or limitations.
        </p>
        <div className="btn-row" style={{ justifyContent: 'center' }}>
          <Link className="btn btn--gold" to="/join">Join the movement</Link>
          <Link className="btn btn--ghost" to="/stories">Watch the stories</Link>
        </div>
        <p className="bos-strip">
          <span>Faith. Family. Freedom.</span><i /><b>H2C</b><i /><span>Legacy in Motion</span>
        </p>
        <p className="bos-strip" style={{ marginTop: 14 }}>
          <span>Boston, Massachusetts</span><i /><span>Built on purpose. Driven by legacy.</span>
        </p>
        <div className="scroll-cue" style={{ position: 'static', justifyContent: 'center', marginTop: 'clamp(22px,3vw,34px)', display: 'flex', alignItems: 'center', gap: 10, fontSize: '.6rem', fontWeight: 600, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--steel)' }}>
          <i style={{ display: 'block', width: 1, height: 26, background: 'linear-gradient(180deg,var(--steel),transparent)' }} className="animate-cue" /> Begin the arc
        </div>
      </div>
    </section>
  );
}
