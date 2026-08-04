import { Link } from 'react-router-dom';
import { Headphones, Play } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ButtonLink } from '@/components/ui/Button';
import { episodes } from '@/data/content';

export function PodcastPreview() {
  return (
    <section id="podcast" className="section-y bg-onyx">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          {/* Left: intro */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              eyebrow="Podcast"
              title="Conversations that go deeper."
              intro="Long-form talks with people who have crossed the distance — and the ones helping others across."
            />
            <div className="mt-8 flex items-center gap-3 text-muted">
              <Headphones size={18} className="text-gold" />
              <span className="text-sm">New episodes every other week</span>
            </div>
            <ButtonLink to="/podcast" variant="outline" withArrow className="mt-8">
              Browse all episodes
            </ButtonLink>
          </div>

          {/* Right: episode list */}
          <ul className="divide-y divide-faint/30 border-t border-faint/30">
            {episodes.map((ep, i) => (
              <Reveal as="li" key={ep.id} delay={i * 70}>
                <Link
                  to="/podcast"
                  className="group flex min-w-0 items-center gap-4 py-6 sm:gap-5 transition-colors hover:bg-raise/40"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-faint/50 text-gold transition group-hover:border-gold group-hover:bg-gold/5">
                    <Play size={16} className="translate-x-0.5 fill-current" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-baseline gap-3">
                      <span className="shrink-0 font-mono text-xs text-gold/70">{ep.number}</span>
                      <span className="min-w-0 truncate text-xs text-muted">{ep.guest}</span>
                    </div>
                    <h3 className="mt-1 truncate font-display text-lg font-medium text-bone">
                      {ep.title}
                    </h3>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-faint">{ep.duration}</span>
                </Link>
              </Reveal>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
