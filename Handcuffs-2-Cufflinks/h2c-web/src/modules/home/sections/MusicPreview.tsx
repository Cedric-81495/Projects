import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ButtonLink } from '@/components/ui/Button';
import { tracks } from '@/data/content';

export function MusicPreview() {
  return (
    <section id="music" className="section-y relative overflow-hidden bg-ink">
      <div className="pointer-events-none absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-green/10 blur-[100px]" aria-hidden />
      <Container className="relative">
        <SectionHeading
          eyebrow="Music · Kitchen Muzik"
          title="The sound of transformation."
          intro="Some things a documentary can’t say. The music does."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          {/* Album art stand-in with equalizer */}
          <Reveal>
            <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl border border-faint/40 bg-onyx">
              <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,rgb(var(--c-gold-deep)),rgb(var(--c-green-deep)),rgb(var(--c-ink)),rgb(var(--c-gold-deep)))] opacity-40" />
              <div className="absolute inset-0 bg-grain opacity-[0.08]" />
              <div className="absolute inset-0 flex items-end justify-center gap-1.5 p-10">
                {[0.4, 0.7, 1, 0.55, 0.85, 0.35, 0.9, 0.6].map((h, i) => (
                  <span
                    key={i}
                    className="w-2 rounded-full bg-gold-sheen eq-bar"
                    style={{ height: `${h * 100}%`, animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
              <span className="absolute bottom-4 left-5 font-mono text-xs uppercase tracking-eyebrow text-bone/80">
                Now playing
              </span>
            </div>
          </Reveal>

          {/* Tracklist */}
          <div>
            <ul className="divide-y divide-faint/30 border-y border-faint/30">
              {tracks.map((t, i) => (
                <Reveal as="li" key={t.id} delay={i * 60}>
                  <button
                    type="button"
                    className="group flex w-full items-center gap-4 py-4 text-left transition-colors hover:text-gold"
                  >
                    <span className="w-6 font-mono text-xs text-faint group-hover:text-gold">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                      <p className="font-display text-lg font-medium text-bone group-hover:text-gold">
                        {t.title}
                      </p>
                      <p className="text-xs text-muted">{t.artist}</p>
                    </div>
                    <span className="font-mono text-xs text-faint">{t.length}</span>
                  </button>
                </Reveal>
              ))}
            </ul>
            <ButtonLink to="/music" variant="green" withArrow className="mt-8">
              Listen to the catalog
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
