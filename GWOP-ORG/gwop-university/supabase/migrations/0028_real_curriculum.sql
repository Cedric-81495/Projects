-- ═══════════════════════════════════════════════════════════════════════════
-- 0028 · REPLACE THE PLACEHOLDER CURRICULUM WITH THE REAL 8 MODULES / 47 LESSONS
-- 2026-09-26
-- ═══════════════════════════════════════════════════════════════════════════
--
-- WHAT WAS WRONG
--
-- 0007 seeded twelve lessons named Credit Foundations, Reading Your Report,
-- Cash Flow Basics, Banking and Debt, Business Setup, Records That Hold Up,
-- Funding Readiness, Revenue Systems, Accessing Capital, Protection, Assets
-- and Investing, Estate and Legacy — the original scaffold. On 2026-09-14
-- src/content/modules.ts replaced that with Shin's real curriculum and
-- recorded, in its own header, that "not one of those titles appears in
-- Shin's document". The seed was never updated, so 0007's claim to "mirror
-- src/content/modules.ts exactly" has been false since that day.
--
-- The portal renders module and lesson lists from modules.ts, so a student
-- has always seen the correct titles. The DATABASE, however, still held the
-- scaffold — and the database is what video, progress and the Expo app key
-- on. A Bunny GUID attaches to a lessons row; there was no correct row to
-- attach a Level 1 video to.
--
-- Counts, for the record. Before: 4 modules, 12 lessons (4/3/3/2 by level).
-- After: 8 modules, 47 lessons (12/9/13/13) — matching both modules.ts and
-- the Pricing, Payment & Package Master price table.
--
-- ⚠ GENERATED FROM src/content/modules.ts, NOT TYPED BY HAND. Slugs, titles,
--   ordering and the module→level mapping were parsed out of that file. If you
--   edit the curriculum there, regenerate rather than patching this by hand —
--   a divergence between the two is exactly the bug this migration fixes.
--
-- ⚠ EVERY LESSON IS published = false, AND THAT IS NOT AN OVERSIGHT.
--   lessons_publishable (0003) refuses to publish a lesson with no video_id,
--   storage_path or external_url. Nothing is filmed.
--
--   ⚠ PUBLISHING TAKES THREE COLUMNS, NOT ONE. lessons_provider_source (0022)
--   additionally refuses a row that carries a video_id while asset_provider is
--   still 'pending'. Setting published alone fails lessons_publishable; setting
--   published + video_id fails lessons_provider_source. All three move together
--   as each file lands — verified against a real Postgres, 2026-09-26:
--
--       insert into public.videos (bunny_video_id, bunny_library_id, title)
--       values ('<bunny guid>', '763136', 'Money is a tool');
--
--       update public.lessons
--          set video_id       = (select id from public.videos
--                                 where bunny_video_id = '<bunny guid>'),
--              asset_provider = 'bunny',
--              published      = true
--        where slug = 'money-is-a-tool';
--
--   Do not reach for `alter table … drop constraint` when one of these fires.
--   Both are doing exactly what they were written to do: stopping a lesson that
--   plays nothing from reaching a student who paid for it.
--
-- ⚠ NO LESSON IS MARKED is_preview, WHICH IS A CHANGE. 0007 set is_preview on
--   the first Freshman lesson ('credit-foundations') as "the one currently
--   shipped as free". That lesson no longer exists, and modules.ts carries no
--   preview flag on any lesson — so there is nothing in the content file that
--   says which lesson is free. Rather than invent one, this migration sets
--   none. It has no effect today: the "preview lessons visible to all" policy
--   requires `published and is_preview`, and nothing is published. Whoever owns
--   the free-lesson decision should set it explicitly:
--       update public.lessons set is_preview = true where slug = '…';
--
-- ⚠ COURSES AND MODULES ARE PUBLISHED, LESSONS ARE NOT. /api/v1/catalog filters
--   courses and modules on published, and the funnel already advertises
--   "8 modules · 47 lessons". 0007 left the Junior and Senior courses
--   unpublished, which dated from the scaffold era. The structure is real and
--   sold; what is inside it is not ready. To revert just that decision:
--       update public.courses set published = false where slug in
--         ('junior-build-scale','senior-legacy');
--
-- ⚠ SAFE TO RE-RUN. Deletes by explicit slug, then inserts. It does not touch
--   enrollments, payments or profiles. lesson_progress cascades from lessons
--   (0005) — no progress rows exist today, because nothing writes them yet.
--
-- ⚠ COURSE SLUGS ARE NOT TOUCHED. freshman-foundation / sophomore-readiness /
--   junior-build-scale / senior-legacy are load-bearing (0012): the level_slug
--   enum, the /app/[level] URLs, and the SKUs. Display names may differ from
--   slugs — that is what `label` is for.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── 1 · Remove the scaffold ────────────────────────────────────────────────
-- Modules cascade to their lessons (0003), which cascade to lesson_progress
-- (0005). Named explicitly rather than `delete from public.modules` so a module
-- added by hand outside this file is not silently destroyed.
delete from public.modules
 where slug in ('credit-and-cash-flow', 'capital-readiness', 'revenue-and-capital', 'assets-and-legacy');

-- ── 2 · The eight real modules ─────────────────────────────────────────────
insert into public.modules (course_id, level, slug, title, sort_order, published)
select c.id, c.level, m.slug, m.title, m.ord, true
from public.courses c
join (values
  ('freshman-foundation', 'the-credit-game', 'The Credit Game: What They Never Taught Us', 1::smallint),
  ('freshman-foundation', 'credit-cleanup-and-control', 'Credit Cleanup & Control', 2::smallint),
  ('sophomore-readiness', 'the-perfect-llc', 'The Perfect LLC: Identity & Structure', 1::smallint),
  ('sophomore-readiness', 'business-credit-infrastructure', 'Business Credit & Fundability Infrastructure', 2::smallint),
  ('junior-build-scale', 'bank-relationships', 'Bank Relationships & Underwriting Psychology', 1::smallint),
  ('junior-build-scale', 'stacking-and-sequencing', 'The Funding Blueprint: Stacking & Sequencing', 2::smallint),
  ('senior-legacy', 'capital-deployment', 'Capital Deployment & Cash Flow Engineering', 1::smallint),
  ('senior-legacy', 'the-90-day-blueprint', 'The 90-Day Blueprint: From Borrower to Lender', 2::smallint)
) as m(course_slug, slug, title, ord) on m.course_slug = c.slug
on conflict (course_id, slug) do update
  set title = excluded.title, sort_order = excluded.sort_order, published = excluded.published;

-- ── 3 · The forty-seven lessons ────────────────────────────────────────────
-- Ordered by module, then by the master doc's own numbering (1.1, 1.2, …), so
-- `sort_order` and Shin's lesson numbers agree. A module's lessons restart at 1.
--
-- duration_sec stays NULL. The master doc records no runtimes and nothing is
-- filmed; modules.ts makes `minutes` optional for the same reason. Fill these
-- in from the actual cut files, never from an estimate.
--
-- kind is 'video' for all 47. The master doc describes every lesson as a
-- recorded lesson or screen recording; the twelve PDFs are COURSE_ASSETS in
-- modules.ts, served by /api/v1/asset, not lesson rows.
insert into public.lessons (module_id, level, slug, title, kind, sort_order, is_preview, published)
select mo.id, mo.level, l.slug, l.title, 'video'::public.lesson_kind, l.ord, false, false
from public.modules mo
join (values
  ('the-credit-game', 'money-is-a-tool', 'Money is a tool, not the trophy', 1::smallint),
  ('the-credit-game', 'the-story-banks-read', 'Your credit report is the story banks read', 2::smallint),
  ('the-credit-game', 'the-five-pillars', 'The five pillars lenders actually weigh', 3::smallint),
  ('the-credit-game', 'fundability-score', 'Score your profile: the Fundability Score', 4::smallint),
  ('the-credit-game', 'statement-date-play', 'The statement date play', 5::smallint),
  ('the-credit-game', 'the-trap-list', 'The trap list: 609 letters, sweeps, and CPNs', 6::smallint),
  ('credit-cleanup-and-control', 'stop-the-bleeding', 'Stop the bleeding before you dispute', 1::smallint),
  ('credit-cleanup-and-control', 'read-all-three-reports', 'Pull and read all three reports', 2::smallint),
  ('credit-cleanup-and-control', 'what-can-be-disputed', 'What can be disputed — and what can''t', 3::smallint),
  ('credit-cleanup-and-control', 'the-cleanup-order', 'The cleanup order that protects your score', 4::smallint),
  ('credit-cleanup-and-control', 'disputes-that-get-read', 'Writing disputes that actually get read', 5::smallint),
  ('credit-cleanup-and-control', 'rebuild', 'Rebuild: removing damage isn''t enough', 6::smallint),
  ('the-perfect-llc', 'entity-state-and-name', 'Decide: entity type, state, and name', 1::smallint),
  ('the-perfect-llc', 'file-the-entity', 'File: articles, registered agent, operating agreement', 2::smallint),
  ('the-perfect-llc', 'ein-naics-and-boi', 'Identify: EIN, NAICS, licenses, and the BOI update', 3::smallint),
  ('the-perfect-llc', 'look-real', 'Look real: address, phone, website, digital footprint', 4::smallint),
  ('the-perfect-llc', 'name-match-audit', 'The name match audit', 5::smallint),
  ('business-credit-infrastructure', 'the-separation-rule', 'Business banking and the separation rule', 1::smallint),
  ('business-credit-infrastructure', 'duns-and-the-bureaus', 'D-U-N-S and the three business bureaus', 2::smallint),
  ('business-credit-infrastructure', 'the-four-tiers', 'The four tiers of business credit', 3::smallint),
  ('business-credit-infrastructure', 'the-vendor-sequence', 'The vendor sequence: which ones actually report', 4::smallint),
  ('bank-relationships', 'how-banks-decide', 'How banks actually decide', 1::smallint),
  ('bank-relationships', 'relationship-banking', 'Relationship banking and seasoning', 2::smallint),
  ('bank-relationships', 'audit-the-bank', 'Audit the bank before you apply', 3::smallint),
  ('bank-relationships', 'five-funding-pillars', 'The five funding pillars', 4::smallint),
  ('bank-relationships', 'relationship-managers', 'Working with relationship managers', 5::smallint),
  ('bank-relationships', 'seven-gate-check', 'The seven-gate readiness check', 6::smallint),
  ('stacking-and-sequencing', 'zero-apr-explained', '0% APR business credit: what it actually is', 1::smallint),
  ('stacking-and-sequencing', 'personal-guarantee', 'The personal guarantee warning', 2::smallint),
  ('stacking-and-sequencing', 'nine-approval-factors', 'The nine approval factors', 3::smallint),
  ('stacking-and-sequencing', 'right-card-for-the-job', 'Choosing the right card for the job', 4::smallint),
  ('stacking-and-sequencing', 'the-funding-map', 'Building the funding map', 5::smallint),
  ('stacking-and-sequencing', 'inquiry-discipline', 'Sequencing, rounds, and inquiry discipline', 6::smallint),
  ('stacking-and-sequencing', 'when-not-to-apply', 'Timing: when not to apply', 7::smallint),
  ('capital-deployment', 'approval-is-not-success', 'Approval is not success', 1::smallint),
  ('capital-deployment', 'good-vs-bad-leverage', 'Good leverage vs. bad leverage', 2::smallint),
  ('capital-deployment', 'use-of-funds-plan', 'The use-of-funds plan', 3::smallint),
  ('capital-deployment', 'allocation', 'Allocation: giving every dollar a job', 4::smallint),
  ('capital-deployment', 'card-strategy', 'Card strategy, points, and protecting cash', 5::smallint),
  ('capital-deployment', 'cycling', 'Cycling: how banks reward good behaviour', 6::smallint),
  ('the-90-day-blueprint', 'phase-1-stabilise', 'Phase 1 — stabilise (days 1-30)', 1::smallint),
  ('the-90-day-blueprint', 'phase-2-position', 'Phase 2 — position (days 31-60)', 2::smallint),
  ('the-90-day-blueprint', 'phase-3-execute', 'Phase 3 — execute (days 61-90)', 3::smallint),
  ('the-90-day-blueprint', 'tracking-and-metrics', 'Tracking and metrics', 4::smallint),
  ('the-90-day-blueprint', 'systems-and-delegation', 'Systems and delegation: buying back time', 5::smallint),
  ('the-90-day-blueprint', 'borrower-to-lender', 'From borrower to lender: how the other side works', 6::smallint),
  ('the-90-day-blueprint', 'compliance-and-next', 'Compliance, structure, and what comes next', 7::smallint)
) as l(module_slug, slug, title, ord) on l.module_slug = mo.slug
on conflict (module_id, slug) do update
  set title = excluded.title, sort_order = excluded.sort_order;

commit;

-- ── VERIFY ─────────────────────────────────────────────────────────────────
-- Expect 8 modules and 47 lessons, split 12 / 9 / 13 / 13, none published.
--
--   select level, count(*) from public.modules group by level order by level;
--   select level, count(*) filter (where published) as published, count(*) as total
--     from public.lessons group by level order by level;
