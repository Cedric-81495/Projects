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
  /* ⚠ LOAD-BEARING FOR THE "Includes" LINE, NOT JUST FOR THE GRANT. 0014 made
     the four individual levels non-cumulative; this is the only field that
     distinguishes them from the bundle, which still grants 1–grants_level. */
  grants_cumulative: boolean
  amount_cents: number | null
  currency: string
  billing: 'one_time' | 'subscription'
}

/* ══ WHAT THIS PLAN ACTUALLY UNLOCKS ═════════════════════════════════════════
   ⚠ THIS LINE WAS WRONG FROM 0014 UNTIL 2026-09-11, AND IT WAS WRONG BESIDE A
   BUY BUTTON.

   It read `Includes stages 1–${plan.grants_level}` for every plan above Level
   1 — so the $297 Level 2 card promised Levels 1 and 2, and the $497 Level 4
   card promised all four. 0014 set grants_cumulative = false on all four
   individual levels: each one now grants exactly itself. The copy was
   describing the access model that migration removed.

   That is not a stale label. It is a statement about what the buyer receives,
   rendered directly above a checkbox they tick to acknowledge the terms, on
   the page that takes their card. Somebody who bought Level 4 on the strength
   of it would have paid $497 for a quarter of what the card said, and the
   no-refund policy is what they would have hit on complaining.

   ⚠ READ grants_cumulative, NEVER grants_level ALONE. The bundle and Level 4
   both carry grants_level = 4 and always have — that ambiguity is exactly what
   produced the bug. The flag is the only thing separating them.

   ⚠ AND "only" IS DELIBERATE. A buyer arriving at Level 3 from a funnel that
   recommends working in order will assume stacking unless told otherwise.
   Saying "Includes Level 3" is true and still leaves them to discover the
   limit after paying. Dropping the word is a copy decision with a refund
   consequence — take it to Surpaul, not to a commit.
   ═══════════════════════════════════════════════════════════════════════════ */
function includesLabel(plan: Pick<Plan, 'grants_level' | 'grants_cumulative'>): string {
  /* Label comes from PATHWAY so a rename reaches here too. Falls back to the
     plain number if grants_level ever points outside the four levels — a
     missing label should not blank the sentence that says what you are buying. */
  const labelFor = (n: number) => PATHWAY.find(p => p.n === n)?.label ?? `Level ${n}`

  if (!plan.grants_cumulative) return `Includes ${labelFor(plan.grants_level)} only`
  if (plan.grants_level === 1) return `Includes ${labelFor(1)}`
  /* Plural noun, bare numbers: "Includes Levels 1–4". Interpolating labelFor(1)
     here would render "Includes Level 1–4", which is the kind of small wrongness
     that reads as carelessness on a page asking for $997. */
  return `Includes Levels 1\u2013${plan.grants_level}`
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
          /* ⚠ NO idempotency_key. The server derives it — see
             lib/stripe/checkout.ts. Sending one from here was what allowed a
             double-click to create two Stripe sessions. */
          return_path: '/dashboard',
          /* The server re-checks the version and refuses a mismatch, so a
             stale tab cannot record agreement to wording nobody saw. */
          ack_accepted: true,
          ack_version: ackCopy.version,
        }),
      })

      const body = await res.json()
      /* ⚠ 409 IS NOT AN ERROR TO SHOW AS RED TEXT. The server returns it when
         the customer already owns the plan, or when their payment succeeded and
         the webhook has not landed yet. Both mean "go to your dashboard", not
         "something broke". Treating it as a failure would tell somebody who has
         just paid that their purchase failed. */
      if (res.status === 409) {
        const body = await res.json().catch(() => null)
        setError(body?.error?.message ?? 'You already have access. Check your dashboard.')
        setPending(false)
        router.push('/dashboard')
        return
      }

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

      <p className="mbincl">{includesLabel(plan)}</p>

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