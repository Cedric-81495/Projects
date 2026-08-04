import { Container } from '@/components/ui/Container';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { tracks } from '@/data/content';

export function MusicPage() {
  const all = tracks.concat(tracks);
  return (
    <>
      <PageHeader
        eyebrow="Music · Kitchen Muzik"
        title="The sound of transformation."
        intro="Some things a documentary can’t say. The music does."
      />
      <section className="section-y bg-ink">
        <Container>
          <ul className="divide-y divide-faint/30 border-y border-faint/30">
            {all.map((t, i) => (
              <Reveal as="li" key={`${t.id}-${i}`} delay={(i % 4) * 50}>
                <button
                  type="button"
                  className="group flex w-full items-center gap-4 py-4 text-left transition-colors hover:text-gold"
                >
                  <span className="w-8 font-mono text-xs text-faint group-hover:text-gold">
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
        </Container>
      </section>
    </>
  );
}
