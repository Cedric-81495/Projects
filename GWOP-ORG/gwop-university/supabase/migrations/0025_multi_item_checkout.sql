-- ════════════════════════════════════════════════════════════════════════════
-- 0025 — MULTI-ITEM CHECKOUT
--
-- One Stripe Checkout Session may now carry several levels. Each level keeps
-- its own price, its own plan row, its own payment_references row and its own
-- enrollment. Nothing is merged into a synthetic "cart product".
--
-- ⚠ THIS RELAXES TWO CONSTRAINTS 0018 EXPLICITLY LISTED AS "ALREADY RIGHT".
-- Read this before assuming it is a mistake.
--
-- 0018's header says, of things nobody should "fix" again:
--     payment_references.stripe_checkout_session_id  unique
--     payment_references.stripe_payment_intent_id    unique
--
-- Both were correct under the assumption they were written for: one session
-- buys one plan, so one session id means one row. That assumption is what is
-- changing, not the protection. A session with three line items legitimately
-- produces three rows, and a single-column unique index would reject the
-- second and third — silently turning a three-level purchase into a one-level
-- purchase, after the customer has paid for three.
--
-- ⚠ THE PROTECTION IS NOT DROPPED, IT IS RE-KEYED. The composite indexes below
-- say "one row per plan per session" and "one row per plan per intent", which
-- is strictly what the old rule meant plus the multi-item case. Recording the
-- same session against the same plan twice is still impossible.
--
-- ⚠ DO NOT REPLACE THESE WITH THE SINGLE-COLUMN VERSIONS. That is the change
-- this file exists to make, and undoing it breaks every cart purchase.
--
-- Everything else 0018 and 0019 built is untouched and still applies per plan:
--   payments_one_open_per_plan     — one open attempt per user per plan
--   payments_one_paid_per_plan     — one successful payment per user per plan
--   payments_attempt_uniq          — one row per (user, plan, attempt)
--   payments_idempotency_uniq      — per-user idempotency
--   next_payment_attempt()         — advisory-locked attempt numbering
--
-- That is deliberate: a cart is a group of independent single-plan purchases
-- that happen to share a session, not a new kind of purchase. Every guarantee
-- that held for one level still holds for each level inside a cart.
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ── 1 · THE GROUP KEY ──────────────────────────────────────────────────────
-- Why a separate column rather than grouping on stripe_checkout_session_id:
-- the rows are inserted BEFORE Stripe is called, and the orphan-resume path in
-- lib/stripe/checkout.ts exists precisely because a request can die between
-- those two steps. Rows with no session id yet must still be recognisable as
-- one purchase, or a retry would strand half a cart.
--
-- Null for every single-item purchase, which is every row created before
-- today. Single-item checkout does not set it and does not need to.
alter table public.payment_references
  add column if not exists checkout_group_id uuid;

comment on column public.payment_references.checkout_group_id is
  'Groups the rows of one multi-item checkout. Null for single-item purchases. '
  'Assigned before Stripe is called so an interrupted request can be resumed.';

create index if not exists payments_group_idx
  on public.payment_references (checkout_group_id)
  where checkout_group_id is not null;

-- ── 2 · RE-KEY THE TWO STRIPE IDENTIFIERS ──────────────────────────────────
-- ⚠ ORDER MATTERS. The new index must exist before the old one is dropped, so
-- there is no window in which a duplicate could be inserted.

create unique index if not exists payments_session_plan_uniq
  on public.payment_references (stripe_checkout_session_id, plan_id)
  where stripe_checkout_session_id is not null;

create unique index if not exists payments_intent_plan_uniq
  on public.payment_references (stripe_payment_intent_id, plan_id)
  where stripe_payment_intent_id is not null;

-- These were created by the column definitions in 0004, so they are table
-- constraints rather than bare indexes. `if exists` keeps this re-runnable.
alter table public.payment_references
  drop constraint if exists payment_references_stripe_checkout_session_id_key;

alter table public.payment_references
  drop constraint if exists payment_references_stripe_payment_intent_id_key;

commit;

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFY — run separately. Not part of the migration.
--
-- A. The new indexes exist and the old constraints are gone. Expect exactly
--    payments_session_plan_uniq and payments_intent_plan_uniq, and NEITHER
--    payment_references_stripe_checkout_session_id_key nor
--    payment_references_stripe_payment_intent_id_key:
--
--      select indexname from pg_indexes
--       where tablename = 'payment_references'
--         and (indexname like '%session%' or indexname like '%intent%');
--
-- B. The per-plan protections 0018 and 0019 added are still in place.
--    Expect all four:
--
--      select indexname from pg_indexes
--       where tablename = 'payment_references'
--         and indexname in ('payments_one_open_per_plan',
--                           'payments_one_paid_per_plan',
--                           'payments_attempt_uniq',
--                           'payments_idempotency_uniq');
--
-- C. Recording one session against the same plan twice still fails. Expect
--    23505 on the second insert, not two rows:
--
--      -- (run against a scratch user/plan, then delete)
--
-- D. Nothing was grouped retroactively. Expect zero rows — every historical
--    purchase was single-item:
--
--      select count(*) from public.payment_references
--       where checkout_group_id is not null;
-- ════════════════════════════════════════════════════════════════════════════
