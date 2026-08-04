import { Container } from '@/components/ui/Container';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/Reveal';

const looks = [
  { name: 'The Cufflink Tee', meaning: 'The mark, worn plainly.' },
  { name: 'Distance Hoodie', meaning: 'For the walk that isn’t finished.' },
  { name: 'Second Suit Cap', meaning: 'Iron on the brim, gold on the crown.' },
  { name: 'Free Hands Crew', meaning: 'What open hands can build.' },
  { name: 'Halfway Longsleeve', meaning: 'Named for the hardest mile.' },
  { name: 'Founder’s Link Chain', meaning: 'The symbol, cast in metal.' },
];

export function ApparelPage() {
  return (
    <>
      <PageHeader
        eyebrow="Apparel · Wear your story"
        title="A symbol you can fasten yourself."
        intro="Every piece carries the mark of the movement. The apparel supports the mission — it never leads it."
      />
      <section className="section-y bg-ink">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {looks.map((look, i) => (
              <Reveal key={look.name} delay={(i % 3) * 80}>
                <article className="group overflow-hidden rounded-2xl border border-faint/40 bg-onyx transition-colors hover:border-gold/50">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,rgb(var(--c-gold)/0.18),transparent_60%)]" />
                    <div className="absolute inset-0 bg-grain opacity-[0.06]" />
                    <span className="absolute bottom-4 left-4 h-8 w-8 rounded-full border border-gold/60" />
                  </div>
                  <div className="p-6">
                    <h2 className="font-display text-lg font-semibold text-bone">{look.name}</h2>
                    <p className="mt-1 text-sm text-muted">{look.meaning}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
          <p className="mt-12 font-mono text-xs uppercase tracking-eyebrow text-faint">
            Full store — coming soon
          </p>
        </Container>
      </section>
    </>
  );
}
