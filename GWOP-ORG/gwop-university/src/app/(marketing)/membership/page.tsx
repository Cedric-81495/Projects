import type { Metadata } from 'next'
import { createServerSupabase } from '@/lib/supabase/server'
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

  return (
    <section className="wrap mbsect">
      <p className="tag">Membership</p>
      <h1 className="h2">Four levels. One blueprint.</h1>
      <p className="lede">
        Each level has a clear purpose and a clear outcome. You finish one before you start
        the next — that&rsquo;s the whole point.
      </p>

      {!plans?.length ? (
        <div className="mbempty">
          <h2>Pricing is being finalised</h2>
          <p>
            The four levels are set. Enrollment opens as soon as pricing is confirmed.
          </p>
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
  )
}
