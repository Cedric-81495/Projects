import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PaymentForm } from '../components/marketing/PaymentForm'
import type { ProgramTier } from '../components/marketing/Tiers'
import { ButtonLink } from '../components/ui/Button'
import { FadeUp } from '../components/ui/FadeUp'
import { FormSuccess } from '../components/ui/Field'
import { LoadingBlock } from '../components/ui/Spinner'
import { apiFetch } from '../lib/api'
import { formatPrice } from '../lib/format'

export function Checkout() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const requestedSlug = searchParams.get('program')

  const [programs, setPrograms] = useState<ProgramTier[] | null>(null)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(requestedSlug)
  const [complete, setComplete] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    apiFetch<{ programs: ProgramTier[] }>('/api/programs', { signal: controller.signal })
      .then((data) => {
        setPrograms(data.programs)

        /**
         * Fall back to the highlighted tier when the slug in the URL does not
         * match anything — a stale bookmark should still present a valid choice
         * rather than an empty page.
         */
        const exists = data.programs.some((program) => program.slug === requestedSlug)
        if (!exists) {
          const fallback = data.programs.find((program) => program.highlighted) ?? data.programs[0]
          setSelectedSlug(fallback?.slug ?? null)
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadError(true)
      })

    return () => controller.abort()
  }, [requestedSlug])

  if (complete) {
    return (
      <div className="py-section">
        <div className="container-page">
          <FadeUp>
            <div className="mx-auto max-w-lg text-center">
              <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-full bg-positive/10 text-positive">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M20 6.5 9.5 17 4 11.5"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h1 className="text-display-md font-semibold text-ink">You are enrolled.</h1>
              <p className="mt-4 text-base leading-relaxed text-muted">
                Your payment went through and your program is active. The next step is uploading
                your documents so your audit can begin.
              </p>

              <div className="mt-8">
                <ButtonLink to="/dashboard" variant="primary" size="lg">
                  Go to your dashboard
                </ButtonLink>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="py-section">
        <div className="container-page mx-auto max-w-lg text-center">
          <h1 className="text-display-sm font-semibold">We could not load the programs.</h1>
          <p className="mt-3 text-muted">
            This is usually temporary. Please refresh, or{' '}
            <Link to="/contact" className="font-medium text-accent hover:underline">
              contact us
            </Link>{' '}
            and we will enroll you directly.
          </p>
        </div>
      </div>
    )
  }

  if (programs === null) return <LoadingBlock label="Loading checkout" />

  const selected = programs.find((program) => program.slug === selectedSlug) ?? programs[0]

  if (!selected) {
    return (
      <div className="py-section">
        <div className="container-page mx-auto max-w-lg text-center">
          <h1 className="text-display-sm font-semibold">No programs are available right now.</h1>
          <p className="mt-3 text-muted">Please check back shortly.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="py-section">
      <div className="container-page">
        <div className="mx-auto max-w-4xl">
          <FadeUp>
            <div>
              <p className="eyebrow">Checkout</p>
              <h1 className="mt-3 text-display-md font-semibold text-ink">
                Confirm and pay
              </h1>
            </div>
          </FadeUp>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.05fr]">
            <FadeUp delay={60}>
              <div className="rounded-card border border-line bg-surface p-7 shadow-soft">
                <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-subtle">
                  Your program
                </h2>

                {/* A visible switcher, so a change of mind does not require going back. */}
                <div className="mt-5 space-y-2.5">
                  {programs.map((program) => {
                    const active = program.slug === selected.slug
                    return (
                      <label
                        key={program.slug}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                          active
                            ? 'border-accent/50 bg-accent-soft/60'
                            : 'border-line hover:bg-raised'
                        }`}
                      >
                        <input
                          type="radio"
                          name="program"
                          value={program.slug}
                          checked={active}
                          onChange={() => {
                            setSelectedSlug(program.slug)
                            // Keep the URL shareable and reload-safe.
                            navigate(`/checkout?program=${program.slug}`, { replace: true })
                          }}
                          className="mt-1 h-4 w-4 accent-[rgb(var(--color-accent))]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="text-[0.9375rem] font-semibold text-ink">
                              {program.name}
                            </span>
                            <span className="shrink-0 text-[0.9375rem] font-semibold tabular-nums text-ink">
                              {formatPrice(program.priceCents, program.currency)}
                            </span>
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-muted">
                            {program.tagline}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>

                <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">Subtotal</dt>
                    <dd className="tabular-nums text-ink">
                      {formatPrice(selected.priceCents, selected.currency)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
                    <dt>Total due today</dt>
                    <dd className="tabular-nums">
                      {formatPrice(selected.priceCents, selected.currency)}
                    </dd>
                  </div>
                </dl>
              </div>
            </FadeUp>

            <FadeUp delay={120}>
              <div className="rounded-card border border-line bg-surface p-7 shadow-soft">
                <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-subtle">
                  Payment details
                </h2>

                <div className="mt-5">
                  {/*
                    Keyed on the slug so switching program rebuilds the Drop-in,
                    which guarantees the button's amount matches the selection.
                  */}
                  <PaymentForm
                    key={selected.slug}
                    programSlug={selected.slug}
                    programName={selected.name}
                    priceCents={selected.priceCents}
                    currency={selected.currency}
                    onSuccess={() => setComplete(true)}
                  />
                </div>
              </div>
            </FadeUp>
          </div>

          <div className="mt-8">
            <FormSuccess>
              Payments are processed by Braintree (a PayPal company). We never see or store your card
              number.
            </FormSuccess>
          </div>
        </div>
      </div>
    </div>
  )
}
