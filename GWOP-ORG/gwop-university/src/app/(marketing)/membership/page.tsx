import type { Metadata } from 'next'
import { PATHWAY_HEADING } from '@/content/pathway'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { BrandBar, Footer } from '@/components/Chrome'
import { PlanCard } from './PlanCard'

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
    .select('id, sku, name, description, grants_level, amount_cents, currency, billing')
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
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                /* Set membership. A plan is owned when its granted level is
                   actually held — not when a higher one is. */
                owned={enrolledLevels.includes(plan.grants_level)}
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
