-- ════════════════════════════════════════════════════════════════════════════
-- 0021 — THE LEVEL 4 ACCESS DEFECT, AND THE MASTER PRICE TABLE
--
-- Source: GWOP Pricing, Payment & Package Master, 2026-09-14. Build order
-- item 4, marked "Yes — revenue leak", and the Part Two price table.
--
-- ── THE DEFECT ─────────────────────────────────────────────────────────────
-- 0007_seed.sql seeded all five plans with grants_cumulative = true. That is
-- correct for the bundle and wrong for the four individual levels, because
-- `grants_level` is a ceiling and `grants_cumulative` decides whether
-- everything beneath it comes too:
--
--   GWOPU-SENIOR          level 4, cumulative  →  unlocks levels 1,2,3,4  $497
--   GWOPU-BLUEPRINT-ALL   level 4, cumulative  →  unlocks levels 1,2,3,4  $997
--
-- Identical access, $500 apart. The $997 bundle is irrational to buy and the
-- "$1,388 separately, save $391" framing on the funnel does not hold, because
-- nobody needs to spend $1,388 — they need to spend $497.
--
-- ⚠ THIS IS NOT A PRICING BUG, IT IS AN ENTITLEMENT BUG. Changing the prices
-- would not fix it. Level 3 has the same shape: at $397 it currently unlocks
-- levels 1 through 3, so $397 buys what $891 of separate purchases buys.
--
-- ── THE FIX ────────────────────────────────────────────────────────────────
-- A level grants itself only. The bundle grants all four.
--
-- Compatible with Surpaul's direction: he ruled out a forced PURCHASE
-- sequence, which is about the order somebody may buy in, not about whether
-- one purchase silently includes three others. After this, a buyer may still
-- start at any level — they simply get the level they paid for.
--
-- ⚠ EXISTING ENROLLMENTS ARE NOT TOUCHED. grants_* is read when a payment is
-- granted, so rows already written keep whatever access they were given. That
-- is deliberate: retroactively removing levels from somebody who has been
-- using them is a support incident and, with a no-refund policy published, an
-- argument we would lose. Checkout has never been live, so in practice this
-- should affect nobody — verify with the audit query at the foot of this file
-- before assuming it.
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ── 1. Each level grants only itself ───────────────────────────────────────
update public.membership_plans
   set grants_cumulative = false
 where sku in (
   'GWOPU-FRESHMAN',
   'GWOPU-SOPHOMORE',
   'GWOPU-JUNIOR',
   'GWOPU-SENIOR'
 );

-- ── 2. The bundle keeps cumulative access. Stated, not assumed ─────────────
-- Written explicitly so the intent survives someone reading step 1 alone and
-- "tidying up" by applying it to every row.
update public.membership_plans
   set grants_cumulative = true,
       grants_level      = 4
 where sku = 'GWOPU-BLUEPRINT-ALL';

-- ── 3. The master price table ──────────────────────────────────────────────
-- Part Two of the master doc. Amounts in cents. These mirror LEVELS and
-- BLUEPRINT_BUNDLE in src/config/membership.ts — if you change one, change
-- both in the same commit, or the page and the charge disagree.
--
-- ⚠ published STAYS FALSE. Writing an amount does not open checkout. The
-- constraint `plans_publishable` refuses to publish a plan with no amount AND
-- no Stripe price ID, so amounts are a precondition for publishing, not the
-- act of it. Publishing is: run scripts/seed-stripe.mts, write the returned
-- price IDs here, set published = true, switch STRIPE_MODE to live.
update public.membership_plans set amount_cents =  19700 where sku = 'GWOPU-FRESHMAN';
update public.membership_plans set amount_cents =  29700 where sku = 'GWOPU-SOPHOMORE';
update public.membership_plans set amount_cents =  39700 where sku = 'GWOPU-JUNIOR';
update public.membership_plans set amount_cents =  49700 where sku = 'GWOPU-SENIOR';
update public.membership_plans set amount_cents =  99700 where sku = 'GWOPU-BLUEPRINT-ALL';

-- ── 4. One-time billing only, everywhere ───────────────────────────────────
-- The master doc: "No payment plans. No instalments. No subscriptions. No
-- recurring charges of any kind." All five rows were already 'one_time'; this
-- asserts it so a stray subscription row cannot appear without a migration.
update public.membership_plans
   set billing = 'one_time'
 where billing is distinct from 'one_time';

commit;

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFY — run these after applying. Neither is part of the migration.
--
-- Expect four rows false, one row (the bundle) true:
--
--   select sku, grants_level, grants_cumulative, billing, amount_cents, published
--     from public.membership_plans
--    order by sort_order;
--
-- Expect ZERO rows. Anybody here was granted levels under the old cumulative
-- rule and still holds them. If this returns anything, decide deliberately
-- whether to leave the access in place — do not quietly revoke it:
--
--   select e.user_id, e.level, e.source, e.created_at
--     from public.enrollments e
--    where e.source = 'purchase'
--    order by e.created_at;
-- ════════════════════════════════════════════════════════════════════════════
