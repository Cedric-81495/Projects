import { useReveal } from '@/lib/useReveal';
import { useAsync } from '@/lib/useAsync';
import { getMusic, getVideos } from '@/services/content';
import { Eyebrow, PhotoWell, Reveal } from '@/shared/ui';
import { SmartImage, VideoPlayer } from '@/shared/media';
import { AsyncContent, EmptyState, LoadingGrid } from '@/shared/state';

export function MusicPage() {
  const releases = useAsync(getMusic, []);
  const videos = useAsync(getVideos, []);
  useReveal(releases.status + videos.status);

  return (
    <>
      <section className="sec t-7" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <Eyebrow>Kitchen Muzik Management</Eyebrow>
          <Reveal as="h2" delay={1} className="h2">Transformation,<br />in another key</Reveal>
          <Reveal delay={1} className="body" as="p">
            Kitchen Muzik Management is a separate company that records and develops artists.
            We feature the music and release apparel alongside it. The two brands partner;
            they are not the same business.
          </Reveal>
        </div>
      </section>

      <section className="sec t-7" style={{ paddingTop: 'clamp(28px,4vw,44px)' }}>
        <div className="wrap">
          <h3 className="h3 rise">Releases</h3>
          <div style={{ marginTop: 18 }}>
            <AsyncContent
              status={releases.status}
              data={releases.data}
              onRetry={releases.reload}
              loading={<LoadingGrid count={4} ratio="1x1" />}
              empty={<EmptyState title="No releases yet" note="Albums, singles and mixtapes will appear here as they drop." />}
            >
              {(list) => (
                <div className="grid4">
                  {list.map((m, i) => (
                    <Reveal key={m.id} delay={((i % 4) + 1) as 1 | 2 | 3} className="card">
                      <SmartImage src={m.media.src} alt={m.t} ratio="1x1" />
                      <div className="card-txt">
                        <span className="chip-reg">{m.type} · {m.yr}</span>
                        <span className="card-name" style={{ fontSize: '1.1rem' }}>{m.t}</span>
                      </div>
                    </Reveal>
                  ))}
                </div>
              )}
            </AsyncContent>
          </div>

          <h3 className="h3 rise" style={{ marginTop: 'clamp(48px,6vw,80px)' }}>Videos</h3>
          <div style={{ marginTop: 18 }}>
            <AsyncContent
              status={videos.status}
              data={videos.data}
              onRetry={videos.reload}
              loading={<LoadingGrid count={3} grid="eps" ratio="16x9" />}
              empty={<EmptyState title="No videos yet" note="Music videos and behind-the-record films will appear here." />}
            >
              {(list) => (
                <div className="eps">
                  {list.map((v, i) => (
                    <Reveal key={v.id} delay={((i % 3) + 1) as 1 | 2 | 3} className="card">
                      <VideoPlayer asset={v.media} label={`Play · ${v.dur}`} />
                      <div className="card-txt">
                        <span className="chip-reg">Video · {v.dur}</span>
                        <span className="card-name" style={{ fontSize: '1.1rem' }}>{v.t}</span>
                      </div>
                    </Reveal>
                  ))}
                </div>
              )}
            </AsyncContent>
          </div>
        </div>
      </section>

      <section className="sec t-light">
        <div className="wrap" style={{ textAlign: 'center' }}>
          <Reveal as="h2" delay={1} className="h2">Listen everywhere</Reveal>
          <Reveal delay={1} className="btn-row">
            <span style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
              {['Spotify', 'Apple Music', 'YouTube', 'SoundCloud'].map((p) => (
                <a key={p} className="btn btn--dark btn--sm" href="#">{p}</a>
              ))}
            </span>
          </Reveal>
        </div>
      </section>

      <PhotoWell src="/assets/look7.jpg" alt="" ratio="21x9" className="rise" />
    </>
  );
}
