'use client'

import { useState } from 'react'
import { PATHWAY } from '@/content/pathway'
import { useRouter } from 'next/navigation'
/* Wording comes from config, not from this component — see the header of
   config/purchase.ts for why. It may change once counsel answers on CROA. */
import { currentAck } from '@/config/purchase'

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
  /* ⚠ FALSE BY DEFAULT AND MUST STAY THAT WAY. A pre-ticked box is not an
     acknowledgement — it is a default the buyer never acted on, which is
     exactly what a dispute would attack. */
  const [ack, setAck] = useState(false)

  const ackCopy = currentAck()

  async function checkout() {
    if (!signedIn) {
      router.push(`/login?next=/membership`)
      return
    }

    /* Checked here as well as in the schema. The schema is the real gate — a
       crafted request skips this entirely — but stopping locally means the
       buyer gets an inline message instead of a 422 from an API call they
       cannot see. */
    if (!ack) {
      setError('Please acknowledge the terms above to continue.')
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
          /* The server re-checks the version and refuses a mismatch, so a
             stale tab cannot record agreement to wording nobody saw. */
          ack_accepted: true,
          ack_version: ackCopy.version,
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
        {/* ⚠ DE-LEVELLED 2026-09-03. Hardcoded 'Freshman' for the single-stage
            plan and "levels 1–N" for bundles. Reads from PATHWAY now so a future
            rename reaches here too. */}
        Includes {plan.grants_level === 1
          ? PATHWAY[0].label
          : `stages 1\u2013${plan.grants_level}`}
      </p>

      {error && (
        <p className="mberr" role="alert">
          {error}
        </p>
      )}

      {/* ⚠ ABOVE THE BUTTON, NOT BELOW IT. Something a buyer must agree to
          before paying has to be readable before the thing they press. Below
          the button it is a footnote to a decision already made.

          Not rendered for a plan somebody already owns, or one with no price —
          there is nothing to acknowledge in either case. */}
      {!owned && plan.amount_cents !== null && (
        <label className="mback">
          <input
            type="checkbox"
            checked={ack}
            onChange={e => {
              setAck(e.target.checked)
              /* Clears the "please acknowledge" message the moment they do.
                 Leaving a stale error beside a ticked box reads as a bug. */
              if (e.target.checked) setError(null)
            }}
          />
          <span>{ackCopy.text}</span>
        </label>
      )}

      {owned ? (
        <p className="mbowned">You&rsquo;re enrolled</p>
      ) : (
        <button
          className="btn btn-e mbbtn"
          onClick={checkout}
          /* Disabled until ticked. Visible-but-inert rather than hidden: a
             button that appears when you tick a box is a surprise, one that
             enables is an explanation. */
          disabled={pending || plan.amount_cents === null || !ack}
        >
          {pending ? 'Opening checkout…' : signedIn ? 'Enroll' : 'Sign in to enroll'}
        </button>
      )}
    </article>
  )
}
