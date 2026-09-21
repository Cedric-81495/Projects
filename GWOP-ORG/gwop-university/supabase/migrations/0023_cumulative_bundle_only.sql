-- ════════════════════════════════════════════════════════════════════════════
-- 0023 — ONLY THE BUNDLE MAY GRANT CUMULATIVE ACCESS
--
-- 0021 corrected the data. This stops it going wrong again.
--
-- ── WHAT WENT WRONG THE FIRST TIME ─────────────────────────────────────────
-- 0007_seed.sql inserted all five plans with grants_cumulative = true, because
-- that is the column default. Correct for the bundle; wrong for the four
-- individual levels, where it meant:
--
--   GWOPU-SENIOR         level 4, cumulative → unlocks 1,2,3,4   $497
--   GWOPU-BLUEPRINT-ALL  level 4, cumulative → unlocks 1,2,3,4   $997
--
-- Identical access, $500 apart, for every purchase until 0021 landed. The
-- defect was not a typo — it was a default doing exactly what defaults do.
-- Nothing in the schema objected, and nothing would object again.
--
-- ── WHY A CONSTRAINT AND NOT A TEST ────────────────────────────────────────
-- The regression tests in tests/entitlements.spec.ts cover the behaviour, but
-- they only run when somebody runs them. This row can be edited in the
-- Supabase dashboard by a person who never opens the repository. A check
-- constraint is the only layer that is present at 2am on a Sunday.
--
-- ⚠ IF THIS MIGRATION FAILS, DO NOT WEAKEN IT. A failure means a row exists
-- that grants a buyer more than they paid for. Find it with verify query A
-- below, work out who bought it, then decide deliberately — the same decision
-- 0021's verify query C describes. Dropping the constraint to get the
-- migration green re-opens a $500 revenue leak.
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ── 1. THE DEFAULT THAT CAUSED IT ──────────────────────────────────────────
-- true was the wrong default the moment per-level access existed (0014). Four
-- of the five plans want false; one wants true. A new plan added without
-- thinking about this column should fail loudly rather than quietly grant
-- everything beneath it.
alter table public.membership_plans
  alter column grants_cumulative set default false;

-- ── 2. THE CONSTRAINT ──────────────────────────────────────────────────────
-- Reads as: a plan may only be cumulative if it is the all-four bundle.
--
-- ⚠ THE SKU IS HARD-CODED AND THAT IS THE POINT. A rule phrased against
-- grants_level — "cumulative is fine at level 4" — would have permitted
-- exactly the bug, because GWOPU-SENIOR is also level 4. That ambiguity is what
-- produced it. The bundle is a specific product, so the constraint names it.
--
-- ⚠ ADDING A SECOND BUNDLE LATER? Extend the IN list in a new migration, in
-- the same commit as the plan row. Do not drop the constraint and re-add it
-- without one, and do not replace it with a boolean flag column — a second
-- flag governing the first is how this class of bug returns.
alter table public.membership_plans
  add constraint plans_cumulative_bundle_only
  check (
    not grants_cumulative
    or sku in ('GWOPU-BLUEPRINT-ALL')
  );

commit;

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFY — run separately. Not part of the migration.
--
-- A. Expect ZERO rows. Anything here would have blocked the migration:
--
--      select sku, grants_level, grants_cumulative
--        from public.membership_plans
--       where grants_cumulative
--         and sku <> 'GWOPU-BLUEPRINT-ALL';
--
-- B. Expect the constraint to reject this. It should raise 23514, not insert:
--
--      insert into public.membership_plans
--        (sku, name, grants_level, grants_cumulative, billing, currency)
--      values ('GWOPU-TEST-LEAK', 'Constraint probe', 4, true, 'one_time', 'USD');
--
--    Then, whichever way it went:
--
--      delete from public.membership_plans where sku = 'GWOPU-TEST-LEAK';
--
-- C. Expect grants_cumulative to default to false:
--
--      select column_name, column_default
--        from information_schema.columns
--       where table_schema = 'public'
--         and table_name = 'membership_plans'
--         and column_name = 'grants_cumulative';
-- ════════════════════════════════════════════════════════════════════════════
