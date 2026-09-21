'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlanCard } from './PlanCard'
import { currentAck } from '@/config/purchase'
import { BLUEPRINT_BUNDLE, fmtMoney } from '@/config/membership'

/* ═══════════════════════════════════════════════════════════════════════════
   MULTI-SELECT — tick several levels, pay one charge

   ⚠ A WRAPPER, NOT A REWRITE OF PlanCard. Each card keeps its own Enrol
   button and its own acknowledgement, and a single purchase still takes the
   path hardened by 0018, 0019 and 0024 — byte-identical. This component adds a
   checkbox beside each card and a bar that buys the ticked ones together.

   Two ways to buy the same thing is usually a smell. Here it is deliberate:
   the single path is the tested one and the one most people use, and putting
   multi-select behind a rewrite of it would risk a double charge to save a
   button.

   ⚠ SELECTION IS COMPONENT STATE, DELIBERATELY NOT A CART TABLE. A persisted
   cart brings abandonment, expiry, reconciliation and a second source of truth
   about what somebody is buying. This lives for thirty seconds. If the tab
   closes, nothing is lost that mattered.

   ⚠ THE TOTAL SHOWN HERE IS COSMETIC. lib/stripe/cart.ts recomputes it from
   membership_plans and refuses the session if the numbers disagree with what
   it expects. Nothing this component calculates reaches Stripe.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ⚠ MIRRORS PlanCard's OWN Plan TYPE, INCLUDING THE NARROW `billing` UNION.
   Widening it to `string` here compiles on its own and then fails the moment a
   plan is handed to PlanCard — two structurally different types with the same
   name. Keep them in step. */
interface Plan {
  id: string
  sku: string
  name: string
  description: string | null
  grants_level: number
  grants_cumulative: boolean
  amount_cents: number | null
  currency: string
  billing: 'one_time' | 'subscription'
}

export function PlanGrid({
  plans,
  enrolledLevels,
  signedIn,
}: {
  plans: Plan[]
  enrolledLevels: number[]
  signedIn: boolean
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])
  const [ack, setAck] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bundleOffer, setBundleOffer] = useState<string | null>(null)

  const ownedOf = (plan: Plan) =>
    plan.grants_cumulative
      ? Array.from({ length: plan.grants_level }, (_, i) => i + 1).every(l =>
          enrolledLevels.includes(l),
        )
      : enrolledLevels.includes(plan.grants_level)

  /* ⚠ THE BUNDLE IS NEVER SELECTABLE. It grants cumulatively, so pairing it
     with a level would bill for that level twice and grant it twice. The
     server refuses it too — this only keeps the tick box from appearing. */
  const selectable = (plan: Plan) =>
    !ownedOf(plan) && plan.sku !== BLUEPRINT_BUNDLE.sku && plan.amount_cents !== null

  const total = useMemo(
    () =>
      plans
        .filter(p => selected.includes(p.sku))
        .reduce((sum, p) => sum + (p.amount_cents ?? 0), 0),
    [plans, selected],
  )

  const bundleCents = (BLUEPRINT_BUNDLE.oneTime ?? 0) * 100
  /* Advisory only — the server enforces the same rule and refuses the sale. */
  const bundleWins = bundleCents > 0 && total >= bundleCents

  function toggle(sku: string) {
    setError(null)
    setBundleOffer(null)
    setSelected(prev => (prev.includes(sku) ? prev.filter(s => s !== sku) : [...prev, sku]))
  }

  async function buySelected() {
    if (pending || selected.length === 0 || !ack) return
    setPending(true)
    setError(null)
    setBundleOffer(null)

    try {
      const res = await fetch('/api/v1/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_skus: selected,
          return_path: '/dashboard',
          ack_accepted: true,
          ack_version: currentAck().version,
        }),
      })
      const json = await res.json()

      if (!res.ok) {
        /* The server's own "the bundle is cheaper" refusal. Surfaced as an
           offer rather than an error, because that is what it is. */
        if (json?.error?.details?.offerBundle) {
          setBundleOffer(json.error.message)
        } else {
          setError(json?.error?.message ?? 'Checkout could not be started.')
        }
        return
      }

      if (json?.data?.url) {
        window.location.href = json.data.url
        return
      }
      setError('Checkout could not be started.')
    } catch {
      /* fetch rejects only when the request never left the device. */
      setError('You appear to be offline. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <div className="mbgrid">
        {plans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            owned={ownedOf(plan)}
            signedIn={signedIn}
            /* So the bundle card can quote the credited price rather than the
               list price. See the note beside `credited` in PlanCard. */
            enrolledLevels={enrolledLevels}
            /* Undefined for anything that cannot be added — the bundle, an
               owned level, an unpriced one, or a signed-out visitor. The card
               then renders exactly as it did before multi-select existed. */
            selection={
              selectable(plan) && signedIn
                ? { checked: selected.includes(plan.sku), onToggle: () => toggle(plan.sku) }
                : undefined
            }
          />
        ))}
      </div>

      {/* ⚠ RENDERS ONLY WHEN SOMETHING IS TICKED. A permanently visible empty
          bar trains people to ignore it, and on mobile it costs a fifth of the
          viewport for nothing. */}
      {selected.length > 0 && (
        <div className="mbcart" role="region" aria-label="Your selection">
          <div className="mbcart-sum">
            <strong>
              {selected.length} level{selected.length > 1 ? 's' : ''} selected
            </strong>
            <span className="mbcart-total">{fmtMoney(total / 100)}</span>
          </div>

          {bundleWins && (
            <p className="mbcart-bundle">
              All four levels together are {fmtMoney(BLUEPRINT_BUNDLE.oneTime ?? 0)} —{' '}
              {fmtMoney((total - bundleCents) / 100)} less than this selection. Choose the
              complete Blueprint instead.
            </p>
          )}

          {bundleOffer && <p className="mbcart-bundle">{bundleOffer}</p>}
          {error && <p className="mberr" role="alert">{error}</p>}

          <label className="mback">
            <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} />
            <span>{currentAck().text}</span>
          </label>

          <div className="mbcart-actions">
            <button
              className="btn btn-e"
              onClick={buySelected}
              disabled={pending || !ack || bundleWins}
            >
              {pending ? 'Opening checkout…' : `Enroll — ${fmtMoney(total / 100)}`}
            </button>
            <button
              className="btn btn-o btn-sm"
              onClick={() => { setSelected([]); setAck(false); setError(null); setBundleOffer(null) }}
              disabled={pending}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </>
  )
}
