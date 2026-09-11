-- ═══════════════════════════════════════════════════════════════════════════
-- 0014_per_level_access.sql
-- Each level grants only itself. The bundle grants all four.
--
-- ⚠ THIS IS THE FIX FOR TWO PROBLEMS THAT LOOK LIKE ONE.
--
-- Surpaul's memo §6, verbatim:
--   "I do NOT want someone forced to purchase Level 1 before they can buy
--    Level 2… Recommended sequence = yes. Forced purchasing sequence = no.
--    If they buy the complete GWOP University bundle, all four levels should
--    appear in their account."
--
-- His §1 prices only make sense under per-level access: he states "$1,388 if
-- purchased separately" and positions $997 as the best deal. Today Level 4 at
-- $497 grants all four, so $1,388 is unreachable and the bundle is worse value
-- than a single $497 purchase. Cumulative access was never his instruction —
-- it came from a schema default in 0004 (`grants_cumulative … default true,
-- -- Junior also grants 1–2`), written before his direction existed.
--
-- ── WHY THE FLAG ALONE DOES NOTHING ───────────────────────────────────────
-- Setting grants_cumulative = false changes how many enrollment ROWS a
-- purchase writes. It does not change what a student can READ, because the
-- policy in 0006 is:
--
--     using (published and level <= public.max_enrolled_level())
--
-- max_enrolled_level() returns max(level) across active enrollments, so a
-- single row at level 3 still grants levels 1, 2 and 3. Flipping the flag
-- without this migration would look like a fix and change nothing.
--
-- So this file does both: the flag, and the read policy.
--
-- ── WHAT CHANGES FOR EXISTING STUDENTS ────────────────────────────────────
-- Nothing, today. enrollments is empty — STRIPE_MODE is test and all five
-- plans have published = false, so no purchase has ever granted anything.
--
-- ⚠ IF THAT IS NO LONGER TRUE WHEN THIS RUNS, STOP AND READ. Anyone holding a
-- single enrollment row at level > 1 loses the levels below it. Check first:
--
--     select user_id, array_agg(level order by level)
--       from public.enrollments where status = 'active' group by user_id;
--
-- Backfill before applying, so nobody's access shrinks under them:
--
--     insert into public.enrollments (user_id, level, status, starts_at, source)
--     select e.user_id, l.level, 'active', now(), 'backfill-0014'
--       from public.enrollments e
--       cross join public.university_levels l
--      where e.status = 'active' and l.level < e.level
--     on conflict (user_id, level) do nothing;
--
-- ── WHAT THIS DOES NOT CHANGE ─────────────────────────────────────────────
-- · max_enrolled_level() stays, and stays correct. Nine call sites use it for
--   DISPLAY — "you have reached Level 3", progress rings, the membership page.
--   Highest-reached is still the right number for those. Only the access
--   decision moves.
-- · Preview lessons stay visible to everyone.
-- · Staff and admin policies are untouched.
-- · Purchase ORDER is still free. Buying Level 3 first is fine and grants
--   Level 3 — which is exactly what "recommended start: Level 3" should mean.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── 1 · The access predicate ──────────────────────────────────────────────
-- Set membership, not <= max. Named rather than inlined because three policies
-- need it and one of them already carries the logic inline — that duplication
-- is how two of them end up disagreeing.
--
-- security definer + a pinned search_path, matching max_enrolled_level(): the
-- function reads enrollments, which is itself protected by RLS, so it has to
-- run as owner or it returns nothing when called from inside a policy.

create or replace function public.can_access_level(
  lvl smallint,
  uid uuid default auth.uid()
)
returns boolean language sql stable security definer
set search_path = public, pg_catalog as $$
  select exists (
    select 1
      from public.enrollments e
     where e.user_id = uid
       and e.level = lvl
       and e.status = 'active'
       and e.starts_at <= now()
       and (e.expires_at is null or e.expires_at > now())
  );
$$;

comment on function public.can_access_level(smallint, uuid) is
  'True when the user holds an active enrollment in EXACTLY this level. '
  'Per-level access per Surpaul memo §6. Use this for access decisions; use '
  'max_enrolled_level() only for display.';

grant execute on function public.can_access_level(smallint, uuid) to authenticated;

-- ── 2 · A companion for the UI ────────────────────────────────────────────
-- The app needs to know WHICH levels, not just the highest, now that they can
-- be non-contiguous — someone who buys Level 1 and Level 3 holds neither a
-- range nor a maximum that describes them.

create or replace function public.enrolled_levels(uid uuid default auth.uid())
returns smallint[] language sql stable security definer
set search_path = public, pg_catalog as $$
  select coalesce(array_agg(e.level order by e.level), '{}')::smallint[]
    from public.enrollments e
   where e.user_id = uid
     and e.status = 'active'
     and e.starts_at <= now()
     and (e.expires_at is null or e.expires_at > now());
$$;

grant execute on function public.enrolled_levels(uuid) to authenticated;

-- ── 3 · The read policies ─────────────────────────────────────────────────
-- Three places in 0006 gate on `level <= max_enrolled_level()`: lessons,
-- videos, and the third at line 129. All move to can_access_level().

drop policy if exists "lessons at or below enrolled level" on public.lessons;

create policy "lessons in an enrolled level" on public.lessons
  for select to authenticated
  using (published and public.can_access_level(level));

drop policy if exists "videos for visible lessons" on public.videos;

create policy "videos for visible lessons" on public.videos
  for select to authenticated using (
    exists (
      select 1 from public.lessons l
       where l.video_id = public.videos.id
         and l.published
         and (l.is_preview or public.can_access_level(l.level))
    )
  );

-- ── 4 · Per-level entitlement on the four individual plans ────────────────
-- The bundle keeps grants_cumulative = true with grants_level = 4, so
-- grant_enrollments_for_payment() writes four rows for it — "all four levels
-- should appear in their account", per §6.

update public.membership_plans
   set grants_cumulative = false
 where sku in ('GWOPU-FRESHMAN','GWOPU-SOPHOMORE','GWOPU-JUNIOR','GWOPU-SENIOR');

commit;

-- ── Verification ──────────────────────────────────────────────────────────
-- The four levels false, the bundle true:
--
--   select sku, grants_level, grants_cumulative
--     from public.membership_plans order by sort_order;
--
-- Both policies present and pointing at the new predicate:
--
--   select tablename, policyname, qual
--     from pg_policies
--    where tablename in ('lessons','videos') and schemaname = 'public';
--
-- ⚠ AND TEST IT AS A STUDENT, not as owner. The SQL editor runs as a
-- superuser, which bypasses RLS entirely — every query here will succeed
-- regardless of whether the policies work. Grant yourself one enrollment at
-- level 3 and confirm from the app that levels 1, 2 and 4 are all closed:
--
--   insert into public.enrollments (user_id, level, status, starts_at, source)
--   values ('<your-uuid>', 3, 'active', now(), 'manual-test');
--
-- Then delete it.
--
-- ── STILL OWED AFTER THIS ─────────────────────────────────────────────────
-- CAPABILITIES.upgradeToHigherLevel is true and not built. Under cumulative
-- access, buying a higher level was an implicit upgrade. It no longer is:
-- someone who buys Level 2 has no route to Level 1 except buying it. That path
-- is now load-bearing rather than nice to have.
-- ═══════════════════════════════════════════════════════════════════════════