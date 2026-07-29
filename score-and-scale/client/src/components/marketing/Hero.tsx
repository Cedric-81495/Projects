import { ButtonLink } from '../ui/Button'
import { FadeUp } from '../ui/FadeUp'
import { SectionLink } from '../ui/SectionLink'
import { ScoreDial } from './ScoreDial'

/**
 * Above-the-fold funnel entry.
 *
 * One primary action, one secondary. Adding a third competing call to action is
 * the most common way a hero loses conversions, so the pricing link is
 * deliberately styled as the quieter option.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden pb-section pt-14 sm:pt-20">
      {/* Decorative backdrop, kept out of the accessibility tree. */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="grid-backdrop absolute inset-x-0 top-0 h-[36rem]" />
        <div className="absolute left-1/2 top-[-14rem] h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-accent/[0.07] blur-3xl" />
      </div>

      <div className="container-page">
        <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10">
          <div>
            <FadeUp>
              <span className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface/70 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur">
                <span className="relative grid h-1.5 w-1.5 place-items-center" aria-hidden="true">
                  <span className="absolute h-full w-full rounded-full bg-accent" />
                </span>
                Now accepting Q3 applications
              </span>
            </FadeUp>

            <FadeUp delay={70}>
              <h1 className="mt-6 text-display-xl font-semibold text-ink">
                Build the credit profile
                <br />
                lenders <span className="text-accent">say yes</span> to.
              </h1>
            </FadeUp>

            <FadeUp delay={140}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
                We audit your personal and business credit, fix what is holding you back, and
                prepare the funding package underwriters actually approve — with an advisor working
                your file alongside you.
              </p>
            </FadeUp>

            <FadeUp delay={210}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonLink to="/register" variant="primary" size="lg">
                  Start your assessment
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M5 12h14M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </ButtonLink>
                <SectionLink
                  section="programs"
                  className="inline-flex h-13 items-center justify-center rounded-xl px-5 text-base font-semibold text-muted transition-colors hover:text-ink"
                >
                  See programs and pricing
                </SectionLink>
              </div>
            </FadeUp>

            <FadeUp delay={280}>
              <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-7">
                {[
                  { value: '112', label: 'Avg. point increase' },
                  { value: '$2.4M', label: 'Funding secured' },
                  { value: '94%', label: 'Approval rate' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <dt className="sr-only">{stat.label}</dt>
                    <dd>
                      <span className="block text-2xl font-semibold tracking-[-0.02em] tabular-nums text-ink">
                        {stat.value}
                      </span>
                      <span className="mt-1 block text-xs leading-snug text-subtle">
                        {stat.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </FadeUp>
          </div>

          <FadeUp delay={160} className="lg:justify-self-end">
            <div className="relative mx-auto w-full max-w-sm">
              <div className="rounded-card border border-line bg-surface p-7 shadow-lifted">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted">Profile strength</p>
                  <span className="rounded-pill bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                    Excellent
                  </span>
                </div>

                <div className="mt-5 grid place-items-center">
                  <ScoreDial />
                </div>

                <ul className="mt-6 space-y-3 border-t border-line pt-5">
                  {[
                    { label: 'Utilisation', value: 'Optimised' },
                    { label: 'Derogatory marks', value: 'Cleared' },
                    { label: 'Business entity', value: 'Structured' },
                  ].map((row) => (
                    <li key={row.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted">{row.label}</span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="text-positive"
                          aria-hidden="true"
                        >
                          <path
                            d="M20 6.5 9.5 17 4 11.5"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        {row.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}
