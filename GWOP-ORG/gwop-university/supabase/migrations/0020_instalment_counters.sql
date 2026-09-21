-- ═══════════════════════════════════════════════════════════════════════════
-- ⚠⚠ RETIRED 2026-09-21 — READ THIS BEFORE ACTING ON ANYTHING BELOW ⚠⚠
--
-- The GWOP Pricing, Payment & Package Master (2026-09-14) ended the payment
-- plan outright. Surpaul, verbatim: "I want to get rid of this totally." There
-- are no instalments, no subscriptions and no recurring charges of any kind,
-- and there is not going to be a plan this migration was preparing for.
--
-- ⚠ THE TWO COLUMNS STAY. They are harmless, they cost nothing, and dropping
-- them would rewrite history for no gain. What is retired is the ROADMAP in
-- the comments below — the "still owed before the plan can be sold" list at
-- the foot of this file. That is not a to-do any more. Do not work from it,
-- and do not treat it as evidence the plan was merely deferred.
--
-- What enforces the decision, so nobody has to trust a comment:
--   · config/membership.ts — no `monthly`, `planMonths` or `planNote` fields
--   · 0021_level_access_fix.sql §3 — asserts billing = 'one_time' on every row
--   · lib/stripe/checkout.ts — refuses any plan whose billing is not one_time
--   · scripts/seed-stripe.mts — creates one-time prices only
--
-- The three reasons are in config/membership.ts beside BLUEPRINT_BUNDLE. If
-- somebody asks for the plan back — and three people have now asked — that is
-- the note to read first, not this file.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 0020_instalment_counters.sql
-- Two columns on `subscriptions` that let a COMPLETED payment plan be told
-- apart from a CANCELLED one.
--
-- ⚠ THIS IS A SAFETY MIGRATION, NOT THE PAYMENT PLAN. The plan itself is TBD
-- and deliberately withdrawn from every surface — BLUEPRINT_BUNDLE.monthly is
-- null in config/membership.ts. Nothing here creates a plan, a price, or a way
-- to buy one. It exists so that when somebody does build it, the trap below is
-- already closed rather than waiting for them.
--
-- ── THE PROBLEM THESE COLUMNS SOLVE ───────────────────────────────────────
-- Surpaul's memo §1 defines the plan as three payments, not a subscription:
-- "3 monthly payments of $397… I do NOT want a traditional endless monthly
-- subscription." A fixed instalment has to STOP, and Stripe stops it with a
-- subscription schedule whose end_behavior is `cancel`.
--
-- Which means a plan that has been paid in full emits
-- customer.subscription.deleted with status `canceled` — identical to what a
-- genuine cancellation emits. The handler for that event sets expires_at on
-- the buyer's enrollments. Without something recording how many payments were
-- actually made, finishing the plan and abandoning it are the same event, and
-- the person who just paid $1,191 loses their access.
--
-- `payments_made` and `payments_required` are what make them distinguishable.
--
-- ── WHY NOT COUNT invoice.payment_succeeded AT READ TIME ──────────────────
-- Because the webhook would have to call Stripe during a handler that must
-- stay fast and must not fail on a network blip, and because a refunded or
-- disputed instalment should not count toward completion while Stripe's
-- invoice list still shows it as paid. A counter we own is a decision we can
-- correct; a derived count is a guess that changes under us.
--
-- ── SAFE TO RUN NOW ───────────────────────────────────────────────────────
-- `subscriptions` is empty — nothing in the codebase inserts into it, verified
-- by grep across src/. Both columns are nullable with a default, so there is
-- no backfill and no lock of consequence.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- How many instalments have actually been collected. Incremented by the
-- invoice.payment_succeeded handler when the plan is built; 0 until then.
alter table public.subscriptions
  add column if not exists payments_made smallint not null default 0;

-- How many the plan requires in total. NULL means "not an instalment plan" —
-- an open-ended subscription, if one ever exists — and the completion check
-- treats NULL as never complete, which is the safe reading: an open-ended
-- subscription that is cancelled SHOULD end access.
alter table public.subscriptions
  add column if not exists payments_required smallint;

comment on column public.subscriptions.payments_made is
  'Instalments collected so far. Compared against payments_required to tell a '
  'completed payment plan from a cancelled one — Stripe emits the same '
  'subscription.deleted event for both.';

comment on column public.subscriptions.payments_required is
  'Total instalments the plan requires (3 for the GWOP bundle plan). NULL for '
  'an open-ended subscription, which is never "complete" and so ends access on '
  'cancellation.';

-- ⚠ A PAID-OFF PLAN CANNOT GO BACKWARDS. Without this, a corrected or replayed
-- webhook could decrement the counter below payments_required and turn a
-- completed plan back into a cancellable one — silently, and only for someone
-- who had already paid in full.
alter table public.subscriptions
  drop constraint if exists subscriptions_payments_sane;

alter table public.subscriptions
  add constraint subscriptions_payments_sane
  check (
    payments_made >= 0
    and (payments_required is null or payments_required > 0)
    and (payments_required is null or payments_made <= payments_required)
  );

commit;

-- ── Verification ──────────────────────────────────────────────────────────
--   select column_name, data_type, column_default, is_nullable
--     from information_schema.columns
--    where table_schema = 'public' and table_name = 'subscriptions'
--      and column_name in ('payments_made','payments_required');
--
-- Two rows. payments_made smallint NOT NULL default 0, payments_required
-- smallint nullable.
--
-- ── STILL OWED BEFORE THE PLAN CAN BE SOLD ────────────────────────────────
-- These columns are inert until something writes them. The remaining work, in
-- the order it has to happen:
--
--   1. A membership_plans row with billing = 'subscription'. Suggested SKU
--      GWOPU-BLUEPRINT-PLAN, grants_level 4, grants_cumulative true — a second
--      way to buy the bundle, not a fifth product.
--   2. A recurring price in scripts/seed-stripe.mts. It creates five one-time
--      prices today and no recurring one.
--   3. A Stripe subscription schedule created in checkout.session.completed —
--      one phase, iterations 3, end_behavior 'cancel'. WITHOUT THIS THE
--      SUBSCRIPTION RUNS FOREVER, which is the thing the memo rules out.
--   4. An INSERT into this table, setting payments_required = 3. Nothing
--      writes it today, so the pause branch updates zero rows.
--   5. invoice.payment_succeeded incrementing payments_made.
--   6. A completion branch ahead of the deletion branch in the webhook:
--      payments_made >= payments_required means permanent, expires_at = null.
--
-- ⚠ AND AN ANSWER FROM SURPAUL ON WHAT "PAUSES" MEANS. His §1 says "if
-- payments stop, access pauses" — a pause can resume. The code expires access
-- at period end, which is termination: a missed second payment ends it, they
-- have paid $794 for nothing, and the no-refund policy is what they meet when
-- they complain. Those are different products and only he can pick one.
-- ═══════════════════════════════════════════════════════════════════════════
