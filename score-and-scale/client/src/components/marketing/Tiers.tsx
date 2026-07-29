import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../../lib/api'
import { cn } from '../../lib/cn'
import { formatPrice } from '../../lib/format'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'
import { FadeUp } from '../ui/FadeUp'
import { Section, SectionHeading } from '../ui/Section'
import { Skeleton } from '../ui/Skeleton'

export interface ProgramTier {
  id: string
  slug: string
  name: string
  tagline: string
  description: string
  priceCents: number
  currency: string
  features: string[]
  highlighted: boolean
}

/**
 * Fallback pricing, shown only if the API cannot be reached.
 *
 * The API is hosted on Render, where a cold start can take several seconds and
 * an outage is possible. A pricing section that renders empty would break the
 * funnel entirely, so the page degrades to these figures — kept in step with
 * the seed data — rather than showing nothing.
 */
const FALLBACK_TIERS: ProgramTier[] = [
  {
    id: 'fallback-foundation',
    slug: 'foundation',
    name: 'Foundation',
    tagline: 'Get your profile lender-ready',
    description:
      'A guided audit of your personal and business credit profile, plus the exact remediation steps that move your score fastest.',
    priceCents: 149_700,
    currency: 'USD',
    features: [
      'Full credit profile audit',
      'Personalised 90-day action plan',
      'Dispute letter templates',
      'Business entity structuring review',
      'Email support',
    ],
    highlighted: false,
  },
  {
    id: 'fallback-accelerator',
    slug: 'accelerator',
    name: 'Accelerator',
    tagline: 'Build the profile lenders approve',
    description:
      'Everything in Foundation, plus hands-on tradeline strategy and a dedicated advisor working your file with you every fortnight.',
    priceCents: 349_700,
    currency: 'USD',
    features: [
      'Everything in Foundation',
      'Dedicated advisor, fortnightly calls',
      'Tradeline and utilisation strategy',
      'Lender-matching shortlist',
      'Document review and preparation',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    id: 'fallback-scale',
    slug: 'scale',
    name: 'Scale',
    tagline: 'Position for serious capital',
    description:
      'For operators ready to raise. We prepare the full funding package and introduce you to lenders matched to your profile.',
    priceCents: 749_700,
    currency: 'USD',
    features: [
      'Everything in Accelerator',
      'Full funding package preparation',
      'Direct lender introductions',
      'Weekly advisor calls',
      'Ongoing profile monitoring',
      'Dedicated account manager',
    ],
    highlighted: false,
  },
]

export function Tiers() {
  const [tiers, setTiers] = useState<ProgramTier[] | null>(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const controller = new AbortController()

    apiFetch<{ programs: ProgramTier[] }>('/api/programs', { signal: controller.signal })
      .then((data) => {
        // An empty catalogue is treated as unusable, not as "no programs".
        setTiers(data.programs.length > 0 ? data.programs : FALLBACK_TIERS)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setTiers(FALLBACK_TIERS)
      })

    return () => controller.abort()
  }, [])

  /**
   * Sends the visitor to checkout, or to registration first if they are a guest.
   * The chosen program is carried through so they land back on the right tier
   * instead of having to pick again.
   */
  const choose = (slug: string) => {
    if (user) {
      navigate(`/checkout?program=${encodeURIComponent(slug)}`)
      return
    }
    navigate(`/register?next=${encodeURIComponent(`/checkout?program=${slug}`)}`)
  }

  return (
    <Section id="programs" tone="canvas">
      <SectionHeading
        eyebrow="Programs"
        title="Pick the level of support you need"
        description="Every program includes the audit and the plan. What changes is how much of the work we do alongside you."
        align="center"
      />

      <div className="mt-14 grid items-start gap-6 lg:grid-cols-3">
        {tiers === null
          ? // Skeletons preserve the card geometry so the grid does not jump.
            Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="rounded-card border border-line bg-surface p-7 shadow-soft"
              >
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-4 h-9 w-32" />
                <Skeleton className="mt-6 h-11 w-full" />
                <div className="mt-6 space-y-3">
                  {Array.from({ length: 5 }, (_, row) => (
                    <Skeleton key={row} className="h-3.5 w-full" />
                  ))}
                </div>
              </div>
            ))
          : tiers.map((tier, index) => (
              <FadeUp key={tier.id} delay={index * 90}>
                <article
                  className={cn(
                    'relative flex h-full flex-col rounded-card border bg-surface p-7',
                    'transition-[transform,box-shadow,border-color] duration-300 ease-entrance hover:-translate-y-1',
                    tier.highlighted
                      ? 'border-accent/40 shadow-lifted lg:-mt-3 lg:pb-9 lg:pt-9'
                      : 'border-line shadow-soft hover:shadow-lifted',
                  )}
                >
                  {tier.highlighted && (
                    <span className="absolute -top-3 left-7 rounded-pill bg-accent px-3 py-1 text-xs font-semibold text-accent-ink">
                      Most chosen
                    </span>
                  )}

                  <h3 className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink">
                    {tier.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted">{tier.tagline}</p>

                  <p className="mt-6 flex items-baseline gap-1.5">
                    <span className="text-display-md font-semibold tabular-nums text-ink">
                      {formatPrice(tier.priceCents, tier.currency)}
                    </span>
                    <span className="text-sm text-subtle">one-time</span>
                  </p>

                  <Button
                    variant={tier.highlighted ? 'accent' : 'secondary'}
                    size="md"
                    fullWidth
                    className="mt-6"
                    onClick={() => choose(tier.slug)}
                  >
                    Choose {tier.name}
                  </Button>

                  <ul className="mt-7 space-y-3 border-t border-line pt-6">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-2.5 text-sm text-muted">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="mt-0.5 shrink-0 text-accent"
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
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </FadeUp>
            ))}
      </div>

      <p className="mt-10 text-center text-sm text-subtle">
        Not sure which fits?{' '}
        <a href="/contact" className="font-medium text-accent underline-offset-4 hover:underline">
          Talk to an advisor
        </a>{' '}
        — it is a conversation, not a sales call.
      </p>
    </Section>
  )
}
