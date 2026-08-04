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
      <section className="section-y bg-green">
        <Container>
          <ul className="divide-y divide-faint/30 border-y border-faint/30">
            {all.map((ep, i) => (
              <Reveal as="li" key={`${ep.id}-${i}`} delay={(i % 3) * 60}>
                <button
                  type="button"
                  className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-5 text-left transition-colors hover:bg-raise/40 sm:gap-5 sm:py-6"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-faint/50 text-gold transition group-hover:border-gold group-hover:bg-gold/5 sm:h-12 sm:w-12">
                    <Play size={15} className="translate-x-0.5 fill-current" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-baseline gap-2">
                      <span className="shrink-0 font-mono text-[0.7rem] text-gold/70 sm:text-xs">
                        {ep.number}
                      </span>
                      <span className="truncate text-[0.7rem] text-muted sm:text-xs">{ep.guest}</span>
                    </div>
                    <h2 className="truncate font-display text-base font-medium text-bone sm:text-lg">
                      {ep.title}
                    </h2>
                  </div>
                  <span className="shrink-0 font-mono text-[0.7rem] text-faint sm:text-xs">
                    {ep.duration}
                  </span>
                </button>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
