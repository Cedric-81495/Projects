-- ═══════════════════════════════════════════════════════════════════════════
-- 0016_plan_names.sql
-- Renames the membership plan display names to Surpaul's level titles.
--
-- ⚠ 0013 MISSED THIS TABLE. It renamed university_levels and courses, and its
-- header even mentions membership_plans — but only to say the SKUs must not
-- change. The `name` column was never touched, so /membership has been showing
-- "Freshman", "Sophomore", "Junior", "Senior" and "The Complete GWOP
-- Blueprint" while every other surface says Level 1–4.
--
-- That is the customer-facing name on the pricing page and on the Stripe
-- receipt, so it is the most visible place the old naming survived.
--
-- ⚠ SKUs ARE NOT TOUCHED, AND MUST NOT BE. GWOPU-FRESHMAN and the rest are
-- referenced by:
--   · scripts/seed-stripe.mts, which matches on sku
--   · the Stripe product metadata already created against those SKUs
--   · grant_enrollments_for_payment(), which resolves the plan by id
-- A display name and a SKU are allowed to differ. Renaming a SKU orphans the
-- Stripe products and breaks re-seeding.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

update public.membership_plans set name = 'Level 1 — Personal Credit'
 where sku = 'GWOPU-FRESHMAN';

update public.membership_plans set name = 'Level 2 — Business Foundation & Business Credit'
 where sku = 'GWOPU-SOPHOMORE';

update public.membership_plans set name = 'Level 3 — Funding & Banking Strategy'
 where sku = 'GWOPU-JUNIOR';

update public.membership_plans set name = 'Level 4 — Execution, Capital & Wealth Strategy'
 where sku = 'GWOPU-SENIOR';

/* Matches the funnel's bundle card heading exactly — content/funnel.ts reads
   "GWOP University — All 4 Levels". A buyer should see the same words on the
   funnel, the pricing page and the receipt. */
update public.membership_plans set name = 'GWOP University — All 4 Levels'
 where sku = 'GWOPU-BLUEPRINT-ALL';

commit;

-- ── Verification ──────────────────────────────────────────────────────────
--   select sku, name, amount_cents, published from public.membership_plans
--    order by sort_order;
--
-- Five rows, Level 1–4 plus the bundle, SKUs unchanged.
--
-- ⚠ Stripe product names are separate and already correct — seed-stripe.mts
-- creates them with these titles. But products created by an EARLIER run still
-- carry "GWOP University · Freshman". Check the Stripe product catalogue and
-- rename there too, or the receipt and the page will disagree.
-- ═══════════════════════════════════════════════════════════════════════════
