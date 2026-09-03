-- ═══════════════════════════════════════════════════════════════════════════
-- 0012 · RENAME THE FOUR LEVELS TO STAGES
-- 2026-09-03 · Surpaul's stage mockup
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Freshman / Sophomore / Junior / Senior become Stage 01–04, with new goal
-- lines. The academic naming implied a cohort and a calendar; stages describe
-- a sequence someone works through at their own pace, which is what the
-- product is.
--
-- ⚠ WHY THIS MIGRATION EXISTS AT ALL. The display names live in two places:
-- src/content/pathway.ts feeds the marketing pages, and this table feeds the
-- student portal through /api/v1/catalog. Changing only the content file would
-- leave the public site saying "Stage 01 · Foundation / Earn the Game" while
-- the portal still said "Freshman · Foundation / Build the foundation".
-- Both were changed together.
--
-- ⚠ WHAT IS DELIBERATELY NOT TOUCHED
--
-- · The `slug` column and the `level_slug` enum. Those values are load-bearing
--   in four places: the enum type itself, the /app/[level] URLs, the course
--   slugs seeded in 0007 (freshman-foundation, sophomore-readiness, …), and the
--   SKUs (GWOPU-FRESHMAN). Renaming them would be an enum migration plus a URL
--   break plus a commerce change. The display name and the slug are allowed to
--   differ — that is what `label` is for.
--
-- · `role_label`. Foundation, Readiness, Build + Scale and Legacy were already
--   correct and the mockup keeps them.
--
-- · `detail`. Unchanged in the mockup.
--
-- · The `courses` table titles from 0007 ("Freshman · Foundation" and so on).
--   Those are course records, not pathway labels, and they are gated behind
--   BLUEPRINTS_APPROVED with no student able to reach them yet. Renaming them
--   is a separate decision about course naming — see the note at the bottom.
--
-- Idempotent: safe to re-run. Matches on slug, which is stable.
-- ═══════════════════════════════════════════════════════════════════════════

update public.university_levels set
  label = 'Stage 01',
  goal  = 'Earn the Game'
where slug = 'freshman';

update public.university_levels set
  label = 'Stage 02',
  goal  = 'Get in Position'
where slug = 'sophomore';

update public.university_levels set
  label = 'Stage 03',
  goal  = 'Get Funded & Build'
where slug = 'junior';

update public.university_levels set
  label = 'Stage 04',
  goal  = 'Get with GWOP Plan'
where slug = 'senior';

-- Verification. Should return four rows, labels Stage 01 through Stage 04,
-- slugs unchanged.
--
--   select level, slug, label, role_label, goal from public.university_levels
--   order by level;
--
-- ⚠ STILL OPEN — COURSE TITLES. Migration 0007 seeds public.courses with
-- titles "Freshman · Foundation", "Sophomore · Readiness" and so on, and slugs
-- freshman-foundation, sophomore-readiness, junior-build-scale. Those now
-- disagree with the pathway naming.
--
-- Not changed here because the course slugs may already be referenced by
-- content, progress records or purchase SKUs, and because renaming a course is
-- a curriculum decision rather than a copy one. Raise it with Surpaul alongside
-- the outstanding content questions; the titles can be updated safely, the
-- slugs cannot.
