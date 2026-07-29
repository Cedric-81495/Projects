import { ButtonLink } from '../ui/Button'
import { FadeUp } from '../ui/FadeUp'

/**
 * Closing conversion band.
 *
 * Inverted against the ink surface so it reads as the end of the page and the
 * last decision point, rather than another content section.
 */
export function CtaBand() {
  return (
    <section className="bg-ink py-section text-canvas">
      <div className="container-page">
        <FadeUp>
          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-7 py-12 sm:px-12 sm:py-16">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative max-w-2xl">
              <h2 className="text-display-lg font-semibold text-canvas">
                Find out what is actually holding your file back.
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-canvas/70">
                Create your account and complete the assessment in under ten minutes. You will get a
                clear read on where your profile stands before you spend anything.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <ButtonLink to="/register" variant="accent" size="lg">
                  Start your assessment
                </ButtonLink>
                <ButtonLink
                  to="/contact"
                  size="lg"
                  className="border border-white/20 bg-transparent text-canvas hover:bg-white/10"
                >
                  Talk to an advisor
                </ButtonLink>
              </div>

              <p className="mt-6 text-xs text-canvas/50">
                No credit card required to create an account.
              </p>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}
