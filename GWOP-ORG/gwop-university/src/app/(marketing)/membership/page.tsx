import type { Metadata } from 'next'
import { PATHWAY_HEADING } from '@/content/pathway'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { BrandBar, Footer } from '@/components/Chrome'
import { PlanGrid } from './PlanGrid'
import { BLUEPRINT_BUNDLE, bundleIsBestDeal } from '@/config/membership'
/* ⚠ THIS IMPORT IS WHY THE PAGE HAS STYLES. DO NOT REMOVE IT AS UNUSED.
   Added 2026-09-11.

   Every class this page and PlanCard use — mbsect, mbgrid, mbcard, mbprice,
   mbincl, mback, mbbtn, mbowned — is defined in portal.css. The (marketing)
   route group has no layout.tsx, so nothing here ever imported it. The page
   shipped with globals.css alone and none of its own rules.

   ⚠ AND IT LOOKED FINE, WHICH IS WHY IT SURVIVED. Arriving from /dashboard is
   a client-side navigation, and (portal)/layout.tsx has already put portal.css
   in the document — so the styles are present for the one route people test.
   Hard-refresh /membership, or open it from a link, an ad or a Stripe return,
   and the stylesheet is never requested. The page renders as unstyled HTML.

   That is the path a buyer arrives on. The comment below already noted this
   group has no layout; the header and footer were fixed by importing the
   components, and the stylesheet was missed.

   A (marketing)/layout.tsx doing this import is the tidier fix once the group
   holds more than one page. One import is enough for one page. */
import '@/styles/portal.css'

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
        {/* ⚠ CHANGED 2026-09-03 with the levels rename. Was the approved
            "Four levels. One blueprint." — kept in step because leaving it while
            every other surface says levels would read as an oversight rather
            than a choice. Flag to Surpaul; trivial to revert. */}
        <h1 className="h2">{PATHWAY_HEADING}</h1>
        {/* Brand direction §8, 2026-08-27, verbatim. */}
        <p className="lede">
          Build the foundation. Become capital-ready. Build and scale. Protect what you create.
        </p>

        {!plans?.length ? (
          <div className="mbempty">
            {/* Brand direction §8: "same meaning, but it reads intentionally rather
                than like unfinished development." */}
            <h2>Founding Membership Coming Soon</h2>
            <p>Enrollment details are coming soon.</p>
          </div>
        ) : (
          <PlanGrid
            /* ⚠ THE BUNDLE FILTER STAYS HERE, SERVER-SIDE. Same rule as
               before: it is offered only while $997 still beats buying the
               levels that are left. See bundleIsBestDeal(). */
            plans={plans.filter(
              (plan) => plan.sku !== BLUEPRINT_BUNDLE.sku || bundleIsBestDeal(enrolledLevels),
            )}
            enrolledLevels={enrolledLevels}
            signedIn={Boolean(userData.user)}
          />
        )}
      </section>
      <Footer />
    </>
  )
}
