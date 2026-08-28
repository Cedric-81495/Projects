import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabase/server'
import { BrandBar, Footer } from '@/components/Chrome'
import { PlanCard } from './PlanCard'

export const metadata: Metadata = {
  title: 'Membership · GWOP University',
  description: 'Four levels. One blueprint. Study in order, at your own pace.',
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

  const enrolled = userData.user
    ? ((await supabase.rpc('max_enrolled_level', { uid: userData.user.id })).data as number) ?? 0
    : 0

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
        <h1 className="h2">Four levels. One blueprint.</h1>
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
                owned={enrolled >= plan.grants_level}
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
