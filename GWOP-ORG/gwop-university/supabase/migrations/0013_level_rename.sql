-- ═══════════════════════════════════════════════════════════════════════════
-- 0013_level_rename.sql
-- Stages removed. Level 1–4 with the titles from Surpaul's final-direction
-- memo. Supersedes 0012_stage_rename.sql entirely.
--
-- ⚠ SHIP THIS IN THE SAME COMMIT AS src/content/pathway.ts. NOT AFTER.
--
-- These names live in exactly two places:
--   · src/content/pathway.ts       — homepage, /830, membership cards, admin
--   · public.university_levels     — the student portal, via /api/v1/catalog
--
-- Apply one without the other and the public site and the student area
-- disagree about what the levels are called. That is not hypothetical: it
-- happened for a day on 2026-09-03 when 0012 landed ahead of the copy.
--
-- ⚠ NO SLUG CHANGES HERE, AND THERE MUST NOT BE. The slugs stay
-- freshman / sophomore / junior / senior because they are load-bearing in four
-- places:
--   · the `level_slug` Postgres enum
--   · the /app/[level] URLs students already have bookmarked
--   · the course slugs seeded in 0007 (freshman-foundation, …)
--   · the SKUs in membership_plans (GWOPU-FRESHMAN, …)
-- A display name and a slug are allowed to differ. Renaming the slugs is an
-- enum migration plus a URL break plus a commerce change — a separate piece of
-- work with a redirect map, not a copy edit.
--
-- ⚠ JAKE: if any GHL workflow condition matches on a level or stage NAME
-- rather than on `grants_level` or a SKU, it stops matching when this runs. He
-- updates his condition FIRST, then this ships. The other order means new
-- students stop entering the right sequence with no error anywhere.
--
-- Naming history, because it has turned over twice and somebody will otherwise
-- restore the middle version:
--   p.4/p.5   Freshman / Sophomore / Junior / Senior  (academic)
--   09-03     Stage 01–04 + goal lines                (0012)
--   09-08     Level 1–4 + subject titles              (this file)
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── The four level rows ───────────────────────────────────────────────────
-- ⚠ THE COLUMN IS `role_label`, NOT `title`. university_levels has no title
-- column — see 0001_foundation.sql. It held the second half of the stage label
-- ("Stage 01" + "Foundation"), and it now holds the subject from the memo
-- ("Level 1" + "Personal Credit"). No schema change needed.
--
-- ⚠ NAME MISMATCH WITH THE TYPESCRIPT, DELIBERATE AND DOCUMENTED. The field is
-- `title` in src/content/pathway.ts because that is what it now is. Same value,
-- two names, mapped by /api/v1/catalog. If you rename either, rename both.
--
-- `goal` is UNCHANGED. Those lines came from the 09-03 mockup and are
-- Surpaul's words — they are not stage names, so they survive the rename.
-- 0012 set them; do not set them again here.

update public.university_levels set
  label      = 'Level 1',
  role_label = 'Personal Credit'
where slug = 'freshman';

update public.university_levels set
  label      = 'Level 2',
  role_label = 'Business Foundation & Business Credit'
where slug = 'sophomore';

update public.university_levels set
  label      = 'Level 3',
  role_label = 'Funding & Banking Strategy'
where slug = 'junior';

update public.university_levels set
  label      = 'Level 4',
  role_label = 'Execution, Capital & Wealth Strategy'
where slug = 'senior';

-- ── Course titles seeded in 0007 ──────────────────────────────────────────
-- 0012 left these reading "Freshman · Foundation" and so on, noting the titles
-- could be updated safely while the slugs could not. Doing that now, so the
-- portal's course headings match the level names above them.
-- Matched on `slug`, never on the old title — a title-based match silently
-- does nothing if 0012 was applied more than once.

update public.courses set title = 'Level 1 · Personal Credit'
  where slug = 'freshman-foundation';
update public.courses set title = 'Level 2 · Business Foundation & Business Credit'
  where slug = 'sophomore-readiness';
update public.courses set title = 'Level 3 · Funding & Banking Strategy'
  where slug = 'junior-build-scale';
update public.courses set title = 'Level 4 · Execution, Capital & Wealth Strategy'
  where slug = 'senior-legacy';

commit;

-- ── Verification ──────────────────────────────────────────────────────────
-- Four rows, labels Level 1 through Level 4, slugs unchanged. If any label
-- still reads "Stage" the update matched nothing — check the slug values
-- before re-running, do not widen the where clause.
--
--   select slug, label, role_label, goal
--     from public.university_levels
--    order by level;
--
-- And confirm nothing depending on the slugs moved:
--
--   select slug, title from public.courses order by slug;
--   select sku, grants_level from public.membership_plans order by sort_order;
