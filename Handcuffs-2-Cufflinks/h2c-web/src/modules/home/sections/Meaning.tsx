import { Container } from '@/components/ui/Container';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ButtonLink } from '@/components/ui/Button';
import { values, journey, symbol } from '@/data/movement';

export function Meaning() {
  return (
    <section id="movement" className="section-y bg-onyx">
      <Container>
        <SectionHeading
          eyebrow="The Movement"
          title={symbol.headline}
          intro={symbol.body}
        />

        {/* Values */}
        <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-faint/40 bg-faint/20 sm:grid-cols-3">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 90} className="bg-onyx">
              <div className="flex h-full flex-col gap-4 p-8">
                <span className="font-mono text-xs text-gold/70">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="font-display text-xl font-semibold text-bone">{v.title}</h3>
                <p className="text-pretty leading-relaxed text-muted">{v.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* The journey — a real ordered sequence, so numbering is earned */}
        <div className="mt-20">
          <div className="rule-gold" />
          <div className="mt-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h3 className="max-w-md text-balance font-display text-2xl font-semibold text-bone">
              The distance, in six steps.
            </h3>
            <ButtonLink to="/movement" variant="ghost" withArrow className="self-start">
              Read the full philosophy
            </ButtonLink>
          </div>

          <ol className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {journey.map((stage, i) => (
              <Reveal as="li" key={stage.key} delay={i * 60}>
                <div className="group flex gap-4 border-t border-faint/40 pt-5">
                  <span className="font-mono text-sm text-gold">{stage.index}</span>
                  <div>
                    <h4 className="font-display text-lg font-semibold text-bone">{stage.label}</h4>
                    <p className="mt-1 text-sm text-muted">{stage.line}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
