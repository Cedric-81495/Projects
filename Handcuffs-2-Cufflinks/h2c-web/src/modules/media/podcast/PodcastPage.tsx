import { useReveal } from '@/lib/useReveal';
import { useAsync } from '@/lib/useAsync';
import { getPodcast, getPodcastClips } from '@/services/content';
import { plain } from '@/lib/text';
import { Eyebrow, Reveal } from '@/shared/ui';
import { VideoPlayer, AudioPlayer } from '@/shared/media';
import { AsyncContent, EmptyState, LoadingGrid, Skeleton } from '@/shared/state';

export function PodcastPage() {
  const episodes = useAsync(getPodcast, []);
  const clips = useAsync(getPodcastClips, []);
  useReveal(episodes.status + clips.status);

  return (
    <>
      <section className="sec t-6" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <Eyebrow>The podcast · conversations that go deeper</Eyebrow>
          <Reveal as="h2" delay={1} className="h2">Hear it in full</Reveal>
          <Reveal delay={1} className="body" as="p">
            Longer conversations that deepen the movement&apos;s message — the parts a
            30-second clip can never hold. Nominate a guest through the community form.
          </Reveal>
        </div>
      </section>

      <section className="sec t-6" style={{ paddingTop: 'clamp(28px,4vw,44px)' }}>
        <div className="wrap">
          <h3 className="h3 rise">Clips</h3>
          <div style={{ marginTop: 18 }}>
            <AsyncContent
              status={clips.status}
              data={clips.data}
              onRetry={clips.reload}
              loading={<LoadingGrid count={3} grid="eps" ratio="16x9" />}
              empty={<EmptyState title="No clips yet" note="Short highlights from each conversation will land here." />}
            >
              {(list) => (
                <div className="eps">
                  {list.map((c, i) => (
                    <Reveal key={c.id} delay={((i % 3) + 1) as 1 | 2 | 3} className="card">
                      <VideoPlayer asset={c.media} label={`Play · ${c.dur}`} />
                      <div className="card-txt">
                        <span className="chip-reg">Clip · {c.dur}</span>
                        <span className="card-name" style={{ fontSize: '1.15rem' }}>{c.t}</span>
                        <span className="body" style={{ margin: '4px 0 0' }}>{c.cap}</span>
                      </div>
                    </Reveal>
                  ))}
                </div>
              )}
            </AsyncContent>
          </div>

          <h3 className="h3 rise" style={{ marginTop: 'clamp(48px,6vw,80px)' }}>Every episode</h3>
          <div style={{ marginTop: 18 }}>
            <AsyncContent
              status={episodes.status}
              data={episodes.data}
              onRetry={episodes.reload}
              loading={
                <div style={{ display: 'grid', gap: 12 }}>
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="sk--line" style={{ height: 64 }} />)}
                </div>
              }
              empty={<EmptyState title="The feed is warming up" note="Full episodes will appear here as they publish." />}
            >
              {(list) => (
                <div style={{ borderTop: '1px solid var(--rule)' }}>
                  {list.map((p) => (
                    <Reveal key={p.id} className="rise">
                      <div style={{ padding: '20px 0', borderBottom: '1px solid var(--rule)', display: 'grid', gap: 14 }}>
                        <div style={{ display: 'flex', gap: 'clamp(14px,3vw,32px)', alignItems: 'baseline' }}>
                          <span className="chip-num" style={{ fontSize: '1.2rem', minWidth: 34 }}>{p.n}</span>
                          <div style={{ flex: 1 }}>
                            <p className="card-name" style={{ fontSize: '1.25rem', marginBottom: 4 }}>{plain(p.title)}</p>
                            <p className="body" style={{ margin: 0 }}>{p.blurb}</p>
                          </div>
                          <span className="chip-reg" style={{ whiteSpace: 'nowrap' }}>{p.dur}</span>
                        </div>
                        <AudioPlayer asset={p.media} title={`Episode ${p.n}`} />
                      </div>
                    </Reveal>
                  ))}
                </div>
              )}
            </AsyncContent>
          </div>
        </div>
      </section>
    </>
  );
}
