import { Play } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { episodes } from '@/data/content';

export function PodcastPage() {
  const all = episodes.concat(episodes).concat(episodes);
  return (
    <>
      <PageHeader
        eyebrow="Podcast"
        title="Conversations that go deeper."
        intro="Long-form talks with people who have crossed the distance — and the ones helping others across."
      />
      <section className="section-y bg-ink">
        <Container>
          <ul className="divide-y divide-faint/30 border-y border-faint/30">
            {all.map((ep, i) => (
              <Reveal as="li" key={`${ep.id}-${i}`} delay={(i % 3) * 60}>
                <button
                  type="button"
                  className="group flex w-full min-w-0 items-center gap-4 py-6 sm:gap-5 text-left transition-colors hover:bg-raise/40"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-faint/50 text-gold transition group-hover:border-gold group-hover:bg-gold/5">
                    <Play size={16} className="translate-x-0.5 fill-current" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-baseline gap-3">
                      <span className="shrink-0 font-mono text-xs text-gold/70">{ep.number}</span>
                      <span className="min-w-0 truncate text-xs text-muted">{ep.guest}</span>
                    </div>
                    <h2 className="mt-1 truncate font-display text-lg font-medium text-bone">
                      {ep.title}
                    </h2>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-faint">{ep.duration}</span>
                </button>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
