import { Container } from '@/components/ui/Container';
import { PageHeader } from '@/components/ui/PageHeader';
import { Reveal } from '@/components/ui/Reveal';
import { ButtonLink } from '@/components/ui/Button';
import { values, journey } from '@/data/movement';

export function MovementPage() {
  return (
    <>
      <PageHeader
        eyebrow="The Movement"
        title={<>The meaning of the symbol.</>}
        intro="Handcuffs 2 Cufflinks is built on one idea: the worst chapter of a life doesn't have to be the last. Here is what that means, and why it matters."
      />

      <section className="section-y bg-green">
        <Container size="prose">
          <div className="mt-12 space-y-6 text-pretty text-lg leading-relaxed text-muted">
            <p>
              A handcuff is fastened <span className="text-bone">to</span> you. It marks a moment you
              may not have chosen, a restraint placed by someone else. A cufflink is fastened{' '}
              <span className="text-bone">by</span> you. It is small, deliberate, and quietly proud —
              the finishing detail of a person who decided who they would become.
            </p>
            <p>
              The movement lives in the distance between those two acts. That distance is rarely
              short and never straight. It is walked in halfway houses and night shifts, in first
              interviews and repaired relationships, in the ordinary discipline of building a life
              that finally fits.
            </p>
            <p className="text-bone">
              We don't celebrate the handcuff. We refuse to let it have the final word.
            </p>
          </div>
        </Container>
      </section>

      <section className="section-y bg-green-deep">
        <Container>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-faint/40 bg-faint/20 sm:grid-cols-3">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 90} className="bg-green-deep">
                <div className="flex h-full flex-col gap-4 p-8">
                  <span className="font-mono text-xs text-gold/70">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-display text-xl font-semibold text-bone">{v.title}</h3>
                  <p className="text-pretty leading-relaxed text-muted">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      <section className="section-y bg-green">
        <Container>
          <h2 className="font-display text-display-md font-semibold text-bone">The journey.</h2>
          <ol className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {journey.map((stage) => (
              <li key={stage.key} className="flex gap-4 border-t border-faint/40 pt-5">
                <span className="font-mono text-sm text-gold">{stage.index}</span>
                <div>
                  <h3 className="font-display text-lg font-semibold text-bone">{stage.label}</h3>
                  <p className="mt-1 text-sm text-muted">{stage.line}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-14">
            <ButtonLink to="/join" variant="gold" size="lg" withArrow>
              Join the movement
            </ButtonLink>
          </div>
        </Container>
      </section>
    </>
  );
}
