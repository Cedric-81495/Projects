import { useMemo, useState } from 'react';
import { useReveal } from '@/lib/useReveal';
import { useAsync } from '@/lib/useAsync';
import { getStories, getCategories } from '@/services/content';
import { plain } from '@/lib/text';
import { Eyebrow, Reveal } from '@/shared/ui';
import { SmartImage, VideoPlayer } from '@/shared/media';
import { AsyncContent, EmptyState, LoadingGrid } from '@/shared/state';
import type { Story } from '@/types';
import { cn } from '@/lib/cn';

const ALL = 'All stories';

export function StoriesPage() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(ALL);
  const [open, setOpen] = useState<Story | null>(null);

  const { status, data, reload } = useAsync(getStories, []);
  const { data: cats } = useAsync(getCategories, []);
  useReveal(cat + q + status);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? []).filter((e) => {
      const catOk = cat === ALL || e.cat === cat;
      const qOk =
        !term ||
        plain(e.title).toLowerCase().includes(term) ||
        e.blurb.toLowerCase().includes(term);
      return catOk && qOk;
    });
  }, [q, cat, data]);

  return (
    <>
      <section className="sec t-5" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <Eyebrow>The Handcuffs 2 Cufflinks Docuseries</Eyebrow>
          <Reveal as="h2" delay={1} className="h2">Real stories of<br />transformation</Reveal>
          <Reveal delay={1} className="body" as="p">
            Every guest started somewhere they did not want to stay. Search the archive, or
            filter by the kind of handcuffs they walked out of.
          </Reveal>

          <div className="field" style={{ maxWidth: 460, marginTop: 24 }}>
            <label htmlFor="q">Search episodes and guests</label>
            <input id="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" />
          </div>

          <div className="chips" style={{ marginTop: 18 }}>
            {[ALL, ...(cats ?? [])].map((c) => (
              <button key={c} className="filter-chip" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
          <p><br /> </p>
        </div>
      </section>

      <section className="sec t-forest" style={{ paddingTop: 'clamp(28px,4vw,44px)' }}>
        <div className="wrap">
          {status === 'ready' && <p className="count">{shown.length} {shown.length === 1 ? 'story' : 'stories'}</p>}
          <AsyncContent
            status={status}
            data={data}
            onRetry={reload}
            loading={<LoadingGrid count={6} grid="eps" ratio="16x9" />}
            empty={
              <EmptyState
                title="The docuseries is in production"
                note="Transformation stories will appear here as episodes are released."
              />
            }
          >
            {() =>
              shown.length === 0 ? (
                <p className="body">No stories match that yet. Try a different word, or clear the filter.</p>
              ) : (
                <div className="eps">
                  {shown.map((e, i) => (
                    <button
                      key={e.id}
                      className={cn('card rise', `d${(i % 3) + 1}`)}
                      style={{ textAlign: 'left' }}
                      onClick={() => setOpen(e)}
                    >
                      <div className="card-media">
                        <SmartImage src={e.media.poster} alt={plain(e.title)} ratio="16x9" />
                        <span className="badge">Ep {e.n}</span>
                      </div>
                      <div className="card-txt">
                        <span className="chip-reg">{e.cat} · {e.dur}</span>
                        <span className="card-name" style={{ fontSize: '1.25rem' }} dangerouslySetInnerHTML={{ __html: e.title }} />
                        <span className="body" style={{ margin: '4px 0 0' }}>{e.blurb}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )
            }
          </AsyncContent>
        </div>
      </section>

      {open && <EpisodeModal ep={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function EpisodeModal({ ep, onClose }: { ep: Story; onClose: () => void }) {
  return (
    <>
      <div className="veil on" onClick={onClose} aria-hidden="true" />
      <aside className="drawer open" role="dialog" aria-modal="true" aria-label={plain(ep.title)} style={{ width: 'min(560px,100vw)' }}>
        <div className="drawer-hd">
          <h3>Episode {ep.n}</h3>
          <button className="icon" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div className="drawer-body" style={{ paddingBottom: 40 }}>
          <div style={{ margin: '10px 0 20px' }}>
            <VideoPlayer asset={ep.media} label="Play episode" />
          </div>
          <span className="tag">{ep.cat} · {ep.dur}</span>
          <h3 className="h3" dangerouslySetInnerHTML={{ __html: ep.title }} />
          <Arc label="The struggle" value={ep.struggle} />
          <Arc label="The turn" value={ep.turn} />
          <Arc label="Now" value={ep.now} />
          <p className="pull" style={{ fontSize: '1.2rem', margin: '24px 0' }}>“{ep.quote}”</p>
          <h6 style={{ margin: 0, color: 'var(--steel)', fontSize: '.63rem', letterSpacing: '.18em', textTransform: 'uppercase' }}>What it taught</h6>
          <ul style={{ margin: '10px 0 0', paddingLeft: 18, display: 'grid', gap: 8 }}>
            {ep.lessons.map((l) => <li key={l} className="body" style={{ margin: 0 }}>{l}</li>)}
          </ul>
        </div>
      </aside>
    </>
  );
}

function Arc({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '14px 0', borderTop: '1px solid var(--rule)' }}>
      <p className="chip-reg" style={{ marginBottom: 6 }}>{label}</p>
      <p className="body" style={{ margin: 0 }}>{value}</p>
    </div>
  );
}
