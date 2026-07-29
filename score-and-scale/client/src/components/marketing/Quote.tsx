import { Section } from '../ui/Section'
import { FadeUp } from '../ui/FadeUp'

const TESTIMONIALS = [
  {
    quote:
      'I had been declined twice and had no idea why. The audit found three items I did not know existed. Ninety days later I closed a $180,000 line.',
    name: 'Marcus Reed',
    role: 'Founder, Reed Logistics',
    delta: '+134 pts',
  },
  {
    quote:
      'The part that mattered was the order. I had tried fixing things myself and kept undoing my own progress. Having a sequence changed the outcome.',
    name: 'Alina Duarte',
    role: 'Owner, Duarte Interiors',
    delta: '+96 pts',
  },
  {
    quote:
      'My advisor prepared the whole package before we approached anyone. The lender asked for two documents and we already had both.',
    name: 'Jordan Whitfield',
    role: 'Director, Whitfield Group',
    delta: '+121 pts',
  },
]

export function Quote() {
  return (
    <Section id="results" tone="raised">
      <div className="grid gap-10 lg:grid-cols-3">
        {TESTIMONIALS.map((testimonial, index) => (
          <FadeUp key={testimonial.name} delay={index * 100}>
            <figure className="flex h-full flex-col rounded-card border border-line bg-surface p-7 shadow-soft">
              <span
                className="mb-5 inline-flex w-fit rounded-pill bg-accent-soft px-2.5 py-1 text-xs font-semibold tabular-nums text-accent"
                aria-label={`Score increase of ${testimonial.delta}`}
              >
                {testimonial.delta}
              </span>

              <blockquote className="flex-1 text-[0.9375rem] leading-relaxed text-ink">
                “{testimonial.quote}”
              </blockquote>

              <figcaption className="mt-6 border-t border-line pt-5">
                <span className="block text-sm font-semibold text-ink">{testimonial.name}</span>
                <span className="mt-0.5 block text-xs text-subtle">{testimonial.role}</span>
              </figcaption>
            </figure>
          </FadeUp>
        ))}
      </div>
    </Section>
  )
}
