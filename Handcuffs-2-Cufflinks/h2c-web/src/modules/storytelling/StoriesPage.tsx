import { Play } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { stories } from '@/data/content';

export function StoriesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Stories · Docuseries"
        title="Real people. Real distance."
        intro="A documentary series following the moment iron becomes gold — told by the people living it."
      />
      <section className="section-y bg-ink">
        <Container>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stories.concat(stories).map((story, i) => (
              <Reveal key={`${story.id}-${i}`} delay={(i % 3) * 90}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-faint/40 bg-onyx transition-colors hover:border-gold/50">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_30%_0%,rgb(var(--c-green)/0.25),transparent_50%),radial-gradient(120%_120%_at_100%_100%,rgb(var(--c-gold)/0.3),transparent_55%)]" />
                    <div className="absolute inset-0 bg-grain opacity-[0.06]" />
                    <span className="absolute left-4 top-4 rounded-full border border-faint/50 bg-ink/60 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                      {story.chapter}
                    </span>
                    <span className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full border border-gold/50 bg-ink/50 text-gold backdrop-blur transition group-hover:scale-105">
                      <Play size={16} className="translate-x-0.5 fill-current" />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="font-display text-xl font-semibold text-bone">{story.title}</h2>
                    <p className="mt-2 flex-1 text-pretty text-sm leading-relaxed text-muted">
                      {story.blurb}
                    </p>
                    <div className="mt-5 flex items-center justify-between border-t border-faint/30 pt-4 text-xs text-faint">
                      <span className="text-muted">{story.guest}</span>
                      <span className="font-mono">{story.duration}</span>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
