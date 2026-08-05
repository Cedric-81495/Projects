import { Link } from 'react-router-dom';
import { Eyebrow, PhotoWell, Reveal } from '@/shared/ui';
import { VideoPlayer, SmartImage } from '@/shared/media';
import { Lookbook } from '@/modules/apparel/Lookbook';
import { lookbook, stories, podcastEpisodes, music } from '@/data';
import { plain } from '@/lib/text';

// Home teasers read the local seed and degrade gracefully: if a
// collection is empty, the teaser collapses rather than showing a
// broken or blank block. The dedicated pages carry the full
// loading / empty / error treatment.

export function LookbookSection() {
  if (lookbook.length === 0) return null;
  return (
    <section className="sec t-3" id="lookbook">
      <div className="wrap">
        <Eyebrow>Wear your story · eight chapters</Eyebrow>
        <Reveal as="h2" delay={1} className="h2">One journey,<br />eight looks.</Reveal>
        <Reveal delay={1} className="body" as="p">
          The shoot is the story. Each look is a chapter of the same arc — the earliest in
          streetwear, the last in tailoring. Apparel supports the mission; it never leads it.
        </Reveal>
        <Lookbook entries={lookbook} />
        <Reveal className="btn-row">
          <Link className="btn btn--ghost" to="/lookbook" style={{ marginTop: 34 }}>See the full lookbook</Link>
        </Reveal>
      </div>
    </section>
  );
}

export function StoriesTeaser() {
  const ep = stories[0];
  if (!ep) return null;
  return (
    <section className="sec t-5" id="stories">
      <div className="wrap">
        <Eyebrow>The Handcuffs 2 Cufflinks Docuseries</Eyebrow>
        <Reveal as="h2" delay={1} className="h2">See the transformation</Reveal>
        <div className="feature">
          <Reveal delay={1}>
            <VideoPlayer asset={ep.media} label="30-second teaser" />
          </Reveal>
          <Reveal delay={2}>
            <span className="tag">Episode {ep.n} · {ep.cat}</span>
            <h3 className="h3" dangerouslySetInnerHTML={{ __html: ep.title }} />
            <p className="body">{ep.blurb}</p>
            <Link className="link" to="/stories">Watch the docuseries</Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function PodcastTeaser() {
  if (podcastEpisodes.length === 0) return null;
  return (
    <section className="sec t-6" id="podcast">
      <div className="wrap">
        <Eyebrow>The podcast · conversations that go deeper</Eyebrow>
        <Reveal as="h2" delay={1} className="h2">Hear it in full</Reveal>
        <div className="eps">
          {podcastEpisodes.slice(0, 3).map((p, i) => (
            <Reveal key={p.id} delay={((i % 3) + 1) as 1 | 2 | 3} className="card">
              <div className="card-txt">
                <span className="chip-reg">Episode {p.n} · {p.dur}</span>
                <p className="card-name" style={{ fontSize: '1.35rem' }}>{plain(p.title)}</p>
                <p className="body" style={{ margin: '6px 0 0' }}>{p.blurb}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="btn-row"><Link className="btn btn--ghost" to="/podcast" style={{ marginTop: 34 }}>All episodes</Link></Reveal>
      </div>
    </section>
  );
}

export function MusicTeaser() {
  if (music.length === 0) return null;
  return (
    <section className="sec t-7" id="music">
      <div className="wrap">
        <Eyebrow>Kitchen Muzik Management · the sound of it</Eyebrow>
        <Reveal as="h2" delay={1} className="h2">Transformation, in another key</Reveal>
        <Reveal delay={1} className="body" as="p">
          A separate company that records and develops artists. We feature the music and
          release apparel alongside it — the two brands partner; they are not the same business.
        </Reveal>
        <div className="grid4">
          {music.slice(0, 4).map((m) => (
            <div className="card rise" key={m.id}>
              <SmartImage src={m.media.src} alt={m.t} ratio="1x1" />
              <div className="card-txt">
                <span className="chip-reg">{m.type} · {m.yr}</span>
                <span className="card-name" style={{ fontSize: '1.1rem' }}>{m.t}</span>
              </div>
            </div>
          ))}
        </div>
        <Reveal className="btn-row"><Link className="btn btn--ghost" to="/music" style={{ marginTop: 34 }}>Explore the catalogue</Link></Reveal>
      </div>
    </section>
  );
}

export function GwopTeaser() {
  return (
    <section className="sec t-light" id="gwop">
      <div className="wrap means">
        <div>
          <Eyebrow>The ecosystem</Eyebrow>
          <Reveal as="h2" delay={1} className="h2">GWOP</Reveal>
          <Reveal delay={1} className="pull" as="p">The step after the story.</Reveal>
          <Reveal delay={2} className="body" as="p">
            GWOP is a separate business under the same founder, focused on ownership,
            opportunity, education, and financial growth. Handcuffs 2 Cufflinks tells the
            story; GWOP is what you build once you have decided to change it.
          </Reveal>
          <Reveal delay={3} className="btn-row"><Link className="btn btn--dark" to="/gwop">Explore GWOP</Link></Reveal>
        </div>
        <Reveal delay={2}>
          <PhotoWell src="/assets/gwop.webp" alt="GWOP — ownership, opportunity, education, growth" ratio="4x5" warm={false} />
        </Reveal>
      </div>
    </section>
  );
}

export function CommunityTeaser() {
  return (
    <section className="sec t-3" id="community">
      <div className="wrap">
        <Eyebrow>The community · your turn</Eyebrow>
        <Reveal as="h2" delay={1} className="h2">Become part of it</Reveal>
        <Reveal delay={1} className="body" as="p">
          The movement is not a spectator sport. Share your own journey — where you started,
          what changed it, where you are now. A person reads every submission, and we contact
          you before anything is published.
        </Reveal>
        <Reveal delay={2} className="btn-row">
          <Link className="btn btn--gold" to="/community">Share your story</Link>
          <Link className="btn btn--ghost" to="/join">Join the movement</Link>
        </Reveal>
      </div>
    </section>
  );
}

export function FounderTeaser() {
  return (
    <section className="sec t-paper" id="founder">
      <div className="wrap means">
        <Reveal delay={1}>
          <PhotoWell src="/assets/look8.jpg" alt="The founder in a tailored suit at night" ratio="4x5" />
        </Reveal>
        <div>
          <Eyebrow>The founder</Eyebrow>
          <Reveal as="h2" delay={1} className="h2">One of them<br />walked in.</Reveal>
          <Reveal delay={2} className="body" as="p">
            Handcuffs 2 Cufflinks did not begin as a brand. It began as one person&apos;s arc
            from limitation to ownership — and the decision to leave the door open behind him
            for everyone still on the other side of that skyline.
          </Reveal>
          <Reveal delay={3} className="btn-row"><Link className="btn btn--ghost" to="/about">Read the founder&apos;s story</Link></Reveal>
        </div>
      </div>
    </section>
  );
}

export function JoinTeaser() {
  return (
    <section className="sec t-light" id="join">
      <div className="wrap" style={{ textAlign: 'center' }}>
        <Reveal as="h2" delay={1} className="h2">Join the movement</Reveal>
        <Reveal delay={1} className="lede" as="p" style={{ margin: '0 auto 1.5em' }}>
          The next episode, the new record, the next chapter of the lookbook — the movement
          hears about all of it a day before anyone else.
        </Reveal>
        <Reveal delay={2} className="btn-row">
          <span style={{ display: 'flex', gap: 14, justifyContent: 'center', width: '100%' }}>
            <Link className="btn btn--dark" to="/join">Get on the list</Link>
          </span>
        </Reveal>
      </div>
    </section>
  );
}
