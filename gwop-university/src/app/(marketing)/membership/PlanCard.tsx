'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Plan {
  id: string
  sku: string
  name: string
  description: string | null
  grants_level: number
  amount_cents: number | null
  currency: string
  billing: 'one_time' | 'subscription'
}

/**
 * The purchase button.
 *
 * Note what is NOT sent to the server: no price, no amount, no currency, no
 * level. Only the SKU. The server resolves everything else from
 * `membership_plans`, so editing this component in devtools changes nothing
 * about what gets charged or what gets unlocked.
 */
export function PlanCard({
  plan,
  owned,
  signedIn,
}: {
  plan: Plan
  owned: boolean
  signedIn: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function checkout() {
    if (!signedIn) {
      router.push(`/login?next=/membership`)
      return
    }

    setPending(true)
    setError(null)

    try {
      const res = await fetch('/api/v1/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_sku: plan.sku,
          // Generated per attempt. A double-tap on a slow connection reuses the
          // same Checkout Session instead of creating a second one.
          idempotency_key: crypto.randomUUID(),
          return_path: '/dashboard',
        }),
      })

      const body = await res.json()
      if (!res.ok) {
        setError(body?.error?.message ?? 'Could not start checkout. Try again.')
        return
      }
      window.location.href = body.data.url
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  const price =
    plan.amount_cents === null
      ? 'Pricing announced soon'
      : new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: plan.currency,
          maximumFractionDigits: 0,
        }).format(plan.amount_cents / 100)

  return (
    <article className="mbcard">
      <h2>{plan.name}</h2>
      {plan.description && <p className="mbdesc">{plan.description}</p>}

      <p className="mbprice">
        {price}
        {plan.billing === 'subscription' && plan.amount_cents !== null && <sub>/month</sub>}
      </p>

      <p className="mbincl">
        Includes {plan.grants_level === 1 ? 'Freshman' : `levels 1–${plan.grants_level}`}
      </p>

      {error && (
        <p className="mberr" role="alert">
          {error}
        </p>
      )}

      {owned ? (
        <p className="mbowned">You&rsquo;re enrolled</p>
      ) : (
        <button
          className="btn btn-e mbbtn"
          onClick={checkout}
          disabled={pending || plan.amount_cents === null}
        >
          {pending ? 'Opening checkout…' : signedIn ? 'Enroll' : 'Sign in to enroll'}
        </button>
      )}
    </article>
  )
}
