GWOP University — payment plan withdrawn + webhook guard, 2026-09-11
====================================================================

    cd /path/to/gwop-university
    unzip -o ~/Downloads/gwop-university-payments.zip

CUMULATIVE. Contains every file changed in this session, so it supersedes
the three earlier zips. Apply this one alone.

FILES
-----
  src/config/membership.ts                     plan nulled + build note
  src/content/funnel.ts                        FAQ plan clause tokenised
  src/components/funnel/Sections.tsx           plan note gated, {plan} token
  src/app/api/webhooks/stripe/route.ts         completion guard
  supabase/migrations/0020_instalment_counters.sql   NEW — run this
  src/styles/funnel.css                        (earlier: layout + padding)
  src/app/830/page.tsx                         (earlier: section split)
  src/app/(marketing)/membership/page.tsx      (earlier: access copy)
  src/app/(marketing)/membership/PlanCard.tsx  (earlier: access copy)

⚠ THERE IS A MIGRATION THIS TIME
--------------------------------
0020 adds two nullable columns to `subscriptions` and one CHECK constraint.
The table is empty — nothing in the codebase inserts into it — so there is
no backfill and no lock of consequence.

    supabase db push        (or paste 0020 into the SQL editor)

RUN IT BEFORE DEPLOYING. The webhook now selects payments_made and
payments_required. Without the columns that select errors — on a dormant
path today, but do not leave the two out of step.

WHAT CHANGED AND WHY
--------------------
1. The payment plan is withdrawn from every surface.
   BLUEPRINT_BUNDLE.monthly = null. The funnel was printing "3 monthly
   payments of $397 · $1,191 total" with nothing behind it: no recurring
   Stripe price, no plan row, no subscription record. Per your call, TBD.

   Two surfaces were NOT covered by the existing guard and would have kept
   advertising it:
     · the access-pause sentence, which sat outside the price guard and
       would have attached plan terms to the $997 one-time purchase
     · the FAQ cost answer, where ", with a 3-payment plan available" was
       hardcoded in the middle of a token-substituted string

   Both read from the same value now. Setting monthly back to 397 turns the
   offer on everywhere at once — which is why it must not be set until the
   mechanism exists.

2. The webhook can no longer revoke access from a completed plan.
   customer.subscription.deleted set expires_at unconditionally. A three-
   payment plan ENDS by design, and Stripe emits the same event for a
   completed schedule as for a cancellation — so finishing the plan would
   have revoked access from the buyer who just paid $1,191.

   The branch now refuses to act unless a subscriptions row exists AND
   records fewer payments than required. This is a HOLD, not the fix: the
   path is dormant today because nothing writes that table. It goes live
   the moment someone adds the insert, which is exactly when the bug would
   otherwise have shipped.

STILL TBD — READ BEFORE BUILDING THE PLAN
-----------------------------------------
The full build note is in config/membership.ts under BLUEPRINT_BUNDLE, and
the remaining steps are listed at the foot of 0020. The short version:

  · The memo asks for a FIXED INSTALMENT, not a subscription. Seeding a
    $397 recurring price and pointing checkout at it builds the endless
    subscription §1 explicitly rules out, and payment four lands on
    somebody who has paid in full. Stripe stops it with a subscription
    schedule: one phase, iterations 3, end_behavior 'cancel'.

  · "If payments stop, access pauses" is not what the code does. It expires
    access at period end, which is termination — a missed second payment
    ends it, they have paid $794 for nothing, and the no-refund policy is
    what they meet when they complain. Pause and expire are different
    products. Surpaul picks; counsel should see both alongside the CROA
    question, since instalment billing for credit-related services is
    squarely what CROA regulates.

NOT CHANGED, WORTH KNOWING
--------------------------
  · The FAQ cost answer reads "…before you buy. so we'll walk through…" —
    REFUND_POLICY.text ends in a full stop and the template continues in
    lowercase. Pre-existing. Left alone because that string is approved
    legal wording and rearranging it is a copy decision, not a fix.

  · PAYMENT.enabled is false and is never read anywhere in the codebase.
    It is not a kill switch. The real gates are membership_plans.published
    and the presence of a Stripe price ID.

CHECK
-----
    npm run typecheck     # passes here
    npm run build         # could not run in the sandbox: no Google Fonts

Then on /830: no "3 monthly payments" line, no access-pause sentence, and
the FAQ cost answer ending "(a $391 savings)." with no plan clause.
