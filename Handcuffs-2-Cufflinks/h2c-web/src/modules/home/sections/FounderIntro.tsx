import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ButtonLink } from '@/components/ui/Button';
import { founder, ecosystem } from '@/data/content';

export function FounderIntro() {
  return (
    <section id="founder" className="section-y bg-green">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {/* Portrait stand-in */}
          <Reveal>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-faint/40 bg-ink">
              <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,rgb(var(--c-gold)/0.22),transparent_55%)]" />
              <div className="absolute inset-0 bg-grain opacity-[0.06]" />
              <div className="absolute bottom-0 left-0 right-0 border-t border-faint/30 bg-ink/60 p-6 backdrop-blur">
                <p className="font-display text-lg font-semibold text-bone">{founder.name}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-eyebrow text-gold">
                  {founder.role}
                </p>
              </div>
            </div>
          </Reveal>

          {/* Quote + ecosystem */}
          <div className="flex flex-col justify-center">
            <Eyebrow>The Founder</Eyebrow>
            <blockquote className="mt-6">
              <p className="text-balance font-display text-3xl font-medium leading-tight text-bone sm:text-4xl">
                &ldquo;{founder.quote}&rdquo;
              </p>
            </blockquote>
            <p className="mt-6 max-w-prose text-pretty leading-relaxed text-muted">{founder.bio}</p>

            <ButtonLink to="/founder" variant="ghost" withArrow className="mt-8 self-start">
              Read the founder&rsquo;s story
            </ButtonLink>

            {/* Ecosystem teaser */}
            <div className="mt-12 rounded-2xl border border-faint/30 bg-ink p-6">
              <p className="font-mono text-[0.65rem] uppercase tracking-eyebrow text-gold">
                One movement, connected brands
              </p>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {ecosystem.map((b) => (
                  <div key={b.id}>
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-display text-base font-semibold text-bone">{b.name}</h3>
                      <span className="text-xs text-faint">{b.role}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{b.body}</p>
                  </div>
                ))}
              </div>
              <ButtonLink to="/ecosystem" variant="ghost" withArrow className="mt-6 self-start text-sm">
                Explore the ecosystem
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
