import { useReveal } from '@/lib/useReveal';
import { useAsync } from '@/lib/useAsync';
import { getCommunityStories } from '@/services/content';
import { Eyebrow, Reveal } from '@/shared/ui';
import { SmartImage } from '@/shared/media';
import { AsyncContent, EmptyState, Skeleton } from '@/shared/state';
import { StoryForm } from './StoryForm';

export function CommunityPage() {
  const { status, data, reload } = useAsync(getCommunityStories, []);
  useReveal(status);

  return (
    <>
      <section className="sec t-forest" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <Eyebrow>The community · participation, not spectating</Eyebrow>
          <Reveal as="h2" delay={1} className="h2">Your journey<br />belongs here</Reveal>
          <Reveal delay={1} className="body" as="p">
            The movement grows when people share their own arc. Tell us where you started,
            what changed it, and where you are now. A person reads every submission, and we
            contact you before anything is published.
          </Reveal>
        </div>
      </section>

      <section className="sec t-6" style={{ paddingTop: 'clamp(28px,4vw,44px)' }}>
        <div className="wrap means" style={{ alignItems: 'start' }}>
          <div>
            <h3 className="h3 rise">Share your story</h3>
            <div className="rise d1" style={{ marginTop: 18 }}>
              <StoryForm />
            </div>
          </div>
          <div>
            <h3 className="h3 rise">From the community</h3>
            <div className="rise d1" style={{ marginTop: 18 }}>
              <AsyncContent
                status={status}
                data={data}
                onRetry={reload}
                loading={
                  <div style={{ display: 'grid', gap: 16 }}>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="sk--line" style={{ height: 108 }} />
                    ))}
                  </div>
                }
                empty={
                  <EmptyState
                    title="Be the first"
                    note="No community stories are published yet. Yours could be the one that opens the door for someone else."
                  />
                }
              >
                {(list) => (
                  <div style={{ display: 'grid', gap: 16 }}>
                    {list.map((s) => (
                      <div key={s.id} className="card" style={{ flexDirection: 'row', gap: 16, alignItems: 'stretch' }}>
                        <div style={{ width: 96, flex: '0 0 96px' }}>
                          <SmartImage src={s.media?.src} alt="" ratio="4x5" fallbackLabel={s.loc} />
                        </div>
                        <div className="card-txt" style={{ padding: 0, justifyContent: 'center' }}>
                          <span className="chip-reg">{s.loc}</span>
                          <span className="card-name" style={{ fontSize: '1.05rem' }}>{s.t}</span>
                          <span className="body" style={{ margin: '4px 0 0', fontSize: '.85rem' }}>{s.b}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </AsyncContent>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
