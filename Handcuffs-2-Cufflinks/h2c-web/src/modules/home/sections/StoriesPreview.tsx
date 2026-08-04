import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ButtonLink } from '@/components/ui/Button';
import { stories } from '@/data/content';

export function StoriesPreview() {
  return (
    <section id="stories" className="section-y bg-ink">
      <Container>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Stories"
            title="Real people. Real distance."
            intro="A documentary series following the moment iron becomes gold — told by the people living it."
          />
          <ButtonLink to="/stories" variant="ghost" withArrow className="shrink-0 self-start sm:self-auto">
            All stories
          </ButtonLink>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {stories.map((story, i) => (
            <Reveal key={story.id} delay={i * 90}>
              <Link
                to="/stories"
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-faint/40 bg-onyx transition-colors duration-300 hover:border-gold/50"
              >
                {/* Thumbnail stand-in */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_30%_0%,rgb(var(--c-green)/0.25),transparent_50%),radial-gradient(120%_120%_at_100%_100%,rgb(var(--c-gold)/0.3),transparent_55%)]" />
                  <div className="absolute inset-0 bg-grain opacity-[0.06]" />
                  <span className="absolute left-4 top-4 rounded-full border border-faint/50 bg-ink/60 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-wider text-muted">
                    {story.chapter}
                  </span>
                  <span className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full border border-gold/50 bg-ink/50 text-gold backdrop-blur transition group-hover:scale-105 group-hover:border-gold">
                    <Play size={16} className="translate-x-0.5 fill-current" />
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-xl font-semibold text-bone">{story.title}</h3>
                  <p className="mt-2 flex-1 text-pretty text-sm leading-relaxed text-muted">
                    {story.blurb}
                  </p>
                  <div className="mt-5 flex items-center justify-between border-t border-faint/30 pt-4 text-xs text-faint">
                    <span className="text-muted">{story.guest}</span>
                    <span className="font-mono">{story.duration}</span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
