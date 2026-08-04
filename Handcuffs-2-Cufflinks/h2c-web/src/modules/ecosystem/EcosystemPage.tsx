import { Container } from '@/components/ui/Container';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { ecosystem } from '@/data/content';

export function EcosystemPage() {
  return (
    <>
      <PageHeader
        eyebrow="Ecosystem"
        title="One movement, connected brands."
        intro="GWOP and Kitchen Muzik Management extend the movement into work and sound — strengthening the mission without overshadowing it."
      />
      <section className="section-y bg-ink">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            {ecosystem.map((b, i) => (
              <Reveal key={b.id} delay={i * 100}>
                <article className="flex h-full flex-col rounded-2xl border border-faint/40 bg-onyx p-8">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-display text-2xl font-semibold text-bone">{b.name}</h2>
                    <span className="font-mono text-[0.65rem] uppercase tracking-eyebrow text-gold">
                      {b.role}
                    </span>
                  </div>
                  <p className="mt-4 flex-1 text-pretty leading-relaxed text-muted">{b.body}</p>
                  <div className="mt-8 rule-gold" />
                </article>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
