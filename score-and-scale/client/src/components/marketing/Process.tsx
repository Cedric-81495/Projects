import { Section, SectionHeading } from '../ui/Section'
import { FadeUp } from '../ui/FadeUp'

const STEPS = [
  {
    step: '01',
    title: 'Full profile audit',
    body: 'We pull your personal and business credit, then map every item that is costing you points or capacity — with the ones worth fixing first ranked by impact.',
  },
  {
    step: '02',
    title: 'Structured remediation',
    body: 'Disputes, utilisation strategy, and entity structuring, executed in the right order. You get a 90-day plan and an advisor who works it with you.',
  },
  {
    step: '03',
    title: 'Funding package',
    body: 'We assemble the documents underwriters ask for before they ask, and shortlist the lenders whose criteria your profile now clears.',
  },
  {
    step: '04',
    title: 'Approval and beyond',
    body: 'Introductions to matched lenders, support through underwriting, and ongoing monitoring so the profile you built keeps working for you.',
  },
]

export function Process() {
  return (
    <Section id="how-it-works" tone="canvas">
      <SectionHeading
        eyebrow="How it works"
        title="Four steps from declined to funded"
        description="No guesswork and no generic checklists. Every step is sequenced because credit repair done out of order costs you months."
      />

      <ol className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((item, index) => (
          <FadeUp key={item.step} delay={index * 90}>
            <li className="relative">
              {/*
                Connector rule between steps on wide screens. Hidden on the last
                item so the sequence does not appear to continue past the end.
              */}
              {index < STEPS.length - 1 && (
                <span
                  className="absolute left-11 top-4 hidden h-px w-[calc(100%-1.5rem)] bg-line lg:block"
                  aria-hidden="true"
                />
              )}

              <span className="relative inline-flex h-8 items-center rounded-pill border border-line bg-surface px-3 text-xs font-semibold tabular-nums text-accent">
                {item.step}
              </span>

              <h3 className="mt-5 text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink">
                {item.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">{item.body}</p>
            </li>
          </FadeUp>
        ))}
      </ol>
    </Section>
  )
}
