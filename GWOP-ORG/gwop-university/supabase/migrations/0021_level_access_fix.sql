-- ════════════════════════════════════════════════════════════════════════════
-- 0021 — GOAL-LINE TYPO, LEVEL 4 ACCESS DEFECT, AND THE MASTER PRICE TABLE
--
-- Source: GWOP Pricing, Payment & Package Master, 2026-09-14.
-- Build order items 1 and 4. Item 4 is marked "Yes — revenue leak".
--
-- Idempotent. Safe to re-run, and safe on a database where membership_plans
-- was never seeded — see §2.
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ── 1. "EARN THE GAME" → "LEARN THE GAME" ──────────────────────────────────
-- 0012_stage_rename.sql wrote 'Earn the Game' into university_levels.goal.
-- The student portal reads that column via /api/v1/catalog, so correcting
-- src/content/pathway.ts alone fixes the marketing site and leaves the portal
-- disagreeing with it — which is exactly the failure pathway.ts warns about.
--
-- Only freshman is wrong. The other three goal lines already match the master
-- doc and are left alone.
update public.university_levels
   set goal = 'Learn the Game'
 where slug = 'freshman'
   and goal is distinct from 'Learn the Game';

-- ── 2. THE PLANS ───────────────────────────────────────────────────────────
-- ⚠ UPSERT, NOT UPDATE, AND THAT IS THE POINT.
--
-- docs/DEPLOY-VERCEL.md says not to run 0007_seed.sql against production, and
-- 0007 is what inserts these five rows. So on production the table is empty,
-- and a plain UPDATE would match nothing, succeed, and report no error — the
-- fix living in a migration that already ran against an empty table.
--
-- Written as an upsert it does the right thing in both places: corrects the
-- rows on staging, creates them correctly on production.
--
-- grants_level references university_levels(level), which IS seeded on
-- production by 0001_foundation.sql, so the foreign keys resolve.
--
-- ── THE DEFECT BEING FIXED ─────────────────────────────────────────────────
-- 0007 seeded all five plans with grants_cumulative = true. Correct for the
-- bundle, wrong for the four levels, because grants_level is a ceiling and
-- grants_cumulative decides whether everything beneath it comes too:
--
--   GWOPU-SENIOR         level 4, cumulative → unlocks levels 1,2,3,4   $497
--   GWOPU-BLUEPRINT-ALL  level 4, cumulative → unlocks levels 1,2,3,4   $997
--
-- Identical access, $500 apart. The bundle is irrational to buy and the
-- "$1,388 separately, save $391" framing does not hold — nobody needs to spend
-- $1,388, they need to spend $497. Level 3 has the same shape at $397.
--
-- Compatible with Surpaul's direction: he ruled out a forced PURCHASE
-- sequence, which is about the order somebody may buy in, not about whether
-- one purchase silently includes three others.
--
-- ⚠ published AND THE STRIPE PRICE IDs ARE NOT IN THE UPDATE CLAUSE. Writing
-- an amount is a precondition for publishing, not the act of it. If a row is
-- already published with a live price, re-running this must not disturb it.
insert into public.membership_plans
  (sku, name, grants_level, grants_cumulative, billing, amount_cents, currency, published, sort_order)
values
  ('GWOPU-FRESHMAN',      'Level 1 — Personal Credit',                        1, false, 'one_time', 19700, 'USD', false, 1),
  ('GWOPU-SOPHOMORE',     'Level 2 — Business Foundation & Business Credit',  2, false, 'one_time', 29700, 'USD', false, 2),
  ('GWOPU-JUNIOR',        'Level 3 — Funding & Banking Strategy',             3, false, 'one_time', 39700, 'USD', false, 3),
  ('GWOPU-SENIOR',        'Level 4 — Execution, Capital & Wealth Strategy',   4, false, 'one_time', 49700, 'USD', false, 4),
  ('GWOPU-BLUEPRINT-ALL', 'GWOP University — All 4 Levels',                   4, true,  'one_time', 99700, 'USD', false, 5)
on conflict (sku) do update set
  name              = excluded.name,
  grants_level      = excluded.grants_level,
  grants_cumulative = excluded.grants_cumulative,
  billing           = excluded.billing,
  amount_cents      = excluded.amount_cents,
  currency          = excluded.currency,
  sort_order        = excluded.sort_order,
  updated_at        = now();

-- ── 3. NO RECURRING BILLING, ANYWHERE ──────────────────────────────────────
-- Master doc: "No payment plans. No instalments. No subscriptions. No
-- recurring charges of any kind." Asserted rather than assumed, so a stray
-- subscription row cannot appear without a migration to explain it.
update public.membership_plans
   set billing = 'one_time'
 where billing is distinct from 'one_time';

commit;

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFY — run separately. Not part of the migration.
--
-- A. Goal lines. Expect Learn the Game / Get in Position / Get Funded & Build /
--    Get with GWOP Plan, in that order:
--
--      select level, slug, label, role_label, goal
--        from public.university_levels
--       order by level;
--
-- B. Plans. Expect five rows, grants_cumulative false on the four levels and
--    true on GWOPU-BLUEPRINT-ALL, all published = false:
--
--      select sku, grants_level, grants_cumulative, billing,
--             amount_cents, published
--        from public.membership_plans
--       order by sort_order;
--
-- C. Expect ZERO rows. Anybody here was granted levels under the old
--    cumulative rule and still holds them. Existing enrollments are
--    deliberately not touched — grants_* is read when a payment is granted, so
--    rows already written keep whatever access they were given. Retroactively
--    removing levels from somebody using them is a support incident and, with
--    a no-refund policy published, an argument we would lose. If this returns
--    anything, decide deliberately. Do not quietly revoke:
--
--      select e.user_id, e.level, e.source, e.created_at
--        from public.enrollments e
--       where e.source = 'purchase'
--       order by e.created_at;
-- ════════════════════════════════════════════════════════════════════════════
