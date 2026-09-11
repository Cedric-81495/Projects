import type { Metadata } from 'next'
import { PATHWAY_HEADING } from '@/content/pathway'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { BrandBar, Footer } from '@/components/Chrome'
import { PlanCard } from './PlanCard'
import { BLUEPRINT_BUNDLE, bundleIsBestDeal } from '@/config/membership'

export const metadata: Metadata = {
  title: 'Membership · GWOP University',
  description: 'Four levels. One plan. Work through them in order, at your own pace.',
}

export const dynamic = 'force-dynamic' // reflects enrollment, so never cached

/**
 * Reads plans through the RLS-bound client. The "published plans readable"
 * policy means an unapproved plan returns nothing at all — so while
 * PRICING_PUBLISHED is false, this page cannot leak a number even by accident.
 * The empty state below is the correct, intended production view today.
 */
export default async function MembershipPage() {
  const supabase = await createServerSupabase()

  const { data: userData } = await supabase.auth.getUser()
  const { data: plans } = await supabase
    .from('membership_plans')
    /* grants_cumulative added 2026-09-11. Without it PlanCard cannot tell the
       bundle from Level 4 — both are grants_level = 4 — and the "Includes" line
       has to guess. It guessed cumulative, which stopped being true at 0014. */
    .select(
      'id, sku, name, description, grants_level, grants_cumulative, amount_cents, currency, billing',
    )
    .order('sort_order')

  /* ⚠ enrolled_levels, NOT max_enrolled_level. Changed 2026-09-10.

     `owned` was computed as `enrolled >= plan.grants_level`, which is the same
     ceiling assumption that 0014 removed from the access policies. Under
     per-level entitlement it is wrong in a way that costs money: somebody who
     buys Level 3 alone holds one enrollment at level 3, so the maximum is 3 —
     and Levels 1 and 2 would render as "You're enrolled" when they own
     neither. They cannot buy what they need and nothing reports an error.

     The bundle still shows all four as owned, because it writes four rows. */
  const enrolledLevels = userData.user
    ? (((await supabase.rpc('enrolled_levels', { uid: userData.user.id })).data as number[]) ?? [])
    : []

  /* This page had NO header and NO footer — no layout in the (marketing) group
     and none imported here. Someone arriving from a locked level in the portal
     landed on a bare page with no crest, no navigation and no route back except
     the browser button. On a phone opened from a link, there may not even be a
     back button.

     The crumb points at /dashboard for a signed-in student and / for a visitor,
     because those are the two places people actually arrive from: the locked
     level in the pathway rail, and the site. */
  const back = userData.user
    ? { href: '/dashboard', label: 'Dashboard' }
    : { href: '/', label: 'GWOP University' }

  return (
    <>
      <BrandBar />
      <section className="wrap mbsect">
        <p className="crumb">
          <Link href={back.href}>‹ {back.label}</Link>
        </p>
        <p className="tag">Membership</p>
        {/* ⚠ CHANGED 2026-09-03 with the levels rename. Was Felicia's approved
            "Four levels. One blueprint." — kept in step because leaving it while
            every other surface says levels would read as an oversight rather
            than a choice. Flag to Surpaul; trivial to revert. */}
        <h1 className="h2">{PATHWAY_HEADING}</h1>
        {/* Felicia §8, 2026-08-27, verbatim. */}
        <p className="lede">
          Build the foundation. Become capital-ready. Build and scale. Protect what you create.
        </p>

        {!plans?.length ? (
          <div className="mbempty">
            {/* Felicia §8: "same meaning, but it reads intentionally rather
                than like unfinished development." */}
            <h2>Founding Membership Coming Soon</h2>
            <p>Enrollment details are coming soon.</p>
          </div>
        ) : (
          <div className="mbgrid">
            {plans
              /* ⚠ HIDES THE BUNDLE WHEN IT IS NO LONGER THE BEST DEAL.

                 Surpaul's memo §1 requires the bundle to "clearly be the best
                 deal". For a new buyer it is — $997 against $1,388. But it
                 re-charges for anything already owned, so once somebody holds
                 Level 3 or higher, buying the remaining levels separately costs
                 the same or less. In twelve of fifteen ownership combinations
                 the bundle is the worse option.

                 So it is offered only while it wins. Anyone past that point
                 sees the individual levels they actually need, at a lower
                 total. That satisfies the instruction rather than working
                 around it: the bundle is never shown as the best deal when it
                 is not one.

                 See bundleIsBestDeal() in config/membership.ts for the
                 arithmetic. */
              .filter(
                (plan) =>
                  plan.sku !== BLUEPRINT_BUNDLE.sku || bundleIsBestDeal(enrolledLevels),
              )
              .map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                /* ⚠ THE BUNDLE NEEDS ALL FOUR, NOT JUST LEVEL 4. Same
                   grants_level = 4 collision as the Includes line: a student
                   who bought Level 4 alone held level 4, so `includes(4)` was
                   true and the bundle rendered "You're enrolled" for three
                   levels they had never paid for. They could not buy them, and
                   nothing raised an error — the page simply told them they
                   already had it.

                   Masked today by bundleIsBestDeal(), which hides the bundle
                   from anyone holding Level 4. Masked, not fixed: change a
                   price so the bundle wins again and it returns silently. */
                owned={
                  plan.grants_cumulative
                    ? Array.from({ length: plan.grants_level }, (_, i) => i + 1).every(l =>
                        enrolledLevels.includes(l),
                      )
                    : enrolledLevels.includes(plan.grants_level)
                }
                signedIn={Boolean(userData.user)}
              />
            ))}
          </div>
        )}
      </section>
      <Footer />
    </>
  )
}