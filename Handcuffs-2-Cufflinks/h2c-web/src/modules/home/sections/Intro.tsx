import { Link } from 'react-router-dom';
import { Eyebrow, PhotoWell, PlayIcon, Reveal } from '@/shared/ui';

export function Trailer() {
  return (
    <section className="sec t-forest" id="trailer">
      <div className="wrap">
        <Eyebrow>The movement trailer · 45 seconds</Eyebrow>
        <Reveal as="h2" delay={1} className="h2">
          Everybody has<br />faced something.
        </Reveal>
        <Reveal delay={2} className="phw phw--21x9 phw--warm" >
          <img className="ph" src="/assets/look8.jpg" alt="The founder in a pale suit at the wheel of an Aston Martin at night, Boston lights behind him" loading="lazy" />
          <span className="phw-cap">Trailer poster · 45-second cut in production</span>
          <button className="play" aria-label="Play the movement trailer. Sound starts muted.">
            <span className="play-ring"><PlayIcon /></span>
            <span className="play-label">Play trailer</span>
          </button>
        </Reveal>
        <Reveal delay={2} className="btn-row" >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 22px', listStyle: 'none', padding: '18px 0 0', margin: 0 }}>
            {['Everybody has a story.', 'Your past is not your final chapter.', 'Wear the transformation.'].map((t) => (
              <span key={t} style={{ fontSize: '.72rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--steel)' }}>{t}</span>
            ))}
          </div>
        </Reveal>
        <Reveal delay={3} className="btn-row" >
          <Link className="btn btn--ghost" to="/movement">Discover the movement</Link>
        </Reveal>
      </div>
    </section>
  );
}

export function MovementMeaning() {
  return (
    <section className="sec t-forest" id="movement">
      <div className="wrap means">
        <div>
          <Eyebrow>What the brand means</Eyebrow>
          <Reveal as="h2" delay={1} className="h2">More than apparel</Reveal>
          <Reveal delay={1} className="pull" as="p">
            You did not have to spend time in prison to go from Handcuffs 2 Cufflinks.
          </Reveal>
          <Reveal delay={2} className="body" as="p">
            Handcuffs 2 Cufflinks represents every journey from limitation to liberation,
            pain to purpose, survival to success, and struggle to strength.
          </Reveal>
          <Reveal delay={2} className="body" as="p">
            <strong>Handcuffs</strong> are whatever held you: incarceration, poverty, addiction,
            trauma, rejection, fear, a bad decision, an environment that wanted you to stay put,
            or your own doubt.
          </Reveal>
          <Reveal delay={2} className="body" as="p">
            <strong>Cufflinks</strong> are what you build next: growth, freedom, discipline,
            confidence, ownership, leadership, purpose.
          </Reveal>
          <Reveal delay={3} className="body" as="p">
            Whatever once held you back can become the reason you move forward.
          </Reveal>
          <Reveal delay={3} className="btn-row">
            <Link className="btn btn--ghost" to="/about">Read our story</Link>
          </Reveal>
        </div>
        <Reveal delay={2} className="means-pair">
          <figure>
            <PhotoWell src="/assets/look1.jpg" alt="The founder seated in a navy Boston hooded sweatsuit, hood up" ratio="2x3" />
            <figcaption>Where it started</figcaption>
          </figure>
          <figure>
            <PhotoWell src="/assets/look8.jpg" alt="The founder in a pale tailored suit in an Aston Martin at night" ratio="2x3" />
            <figcaption>Where it goes</figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}

export function Boston() {
  return (
    <section className="sec t-forest" id="boston">
      <div className="wrap">
        <Eyebrow>Boston, Massachusetts</Eyebrow>
        <Reveal as="h2" delay={1} className="h2">Built in <span className="gold-t">Boston</span></Reveal>
        <Reveal delay={1} className="lede" as="p">
          This did not start in a boardroom. It started here, in a city that does not hand
          anything over and does not forget where you came from either.
        </Reveal>
        <Reveal delay={2} className="body" as="p">
          You can see the whole arc from the Charlestown side of the Zakim: the bridge, the
          harbour, and the towers downtown lit up all night. Some people grow up looking at
          that skyline from the outside. Handcuffs 2 Cufflinks is what happens when one of
          them decides to walk into it.
        </Reveal>
        <Reveal delay={2} className="hrule"><i /><b>H2C</b><i /></Reveal>
        <Reveal delay={2} className="vals">
          <div><b>Faith</b><span>What carried it</span></div>
          <div><b>Family</b><span>Who it is for</span></div>
          <div><b>Freedom</b><span>What it cost</span></div>
          <div><b>Legacy</b><span>In motion</span></div>
        </Reveal>
        <Reveal delay={3} className="bos-strip" as="p">
          <span>From the Zakim to the Financial District</span><i /><b>H2C</b><i /><span>From struggle to success</span>
        </Reveal>
      </div>
    </section>
  );
}
