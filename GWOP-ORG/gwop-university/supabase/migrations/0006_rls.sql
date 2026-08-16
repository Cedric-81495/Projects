-- ============================================================================
-- 0006_rls.sql — every policy in the system, in one reviewable file
--
-- READ THIS BEFORE CHANGING ANYTHING.
--   RLS is enabled and FORCED on all 13 tables with NO policies, which means
--   default deny. Only what is written below is permitted. A table that gains
--   a policy here without a matching test in tests/rls.spec.ts is unreviewed.
--
--   `anon` and `authenticated` are the only roles that reach these policies.
--   The service role bypasses RLS entirely — which is exactly why the service
--   key never leaves the server and never appears in a NEXT_PUBLIC_ variable.
-- ============================================================================

-- ── university_levels — public reference data (the marketing site renders it)
create policy "levels readable by anyone" on public.university_levels
  for select to anon, authenticated using (true);
create policy "levels writable by admin" on public.university_levels
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── profiles
create policy "read own profile" on public.profiles
  for select to authenticated using (id = auth.uid() and deleted_at is null);
create policy "staff read all profiles" on public.profiles
  for select to authenticated using (public.has_role('staff'));

-- The WITH CHECK re-asserts id = auth.uid() so an UPDATE cannot rewrite the
-- row's owner. Omitting it is the classic RLS mistake.
create policy "update own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid() and deleted_at is null) with check (id = auth.uid());
create policy "admin manage profiles" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── user_roles
-- Writes restricted to `owner`, not `admin`: compromising an admin account
-- must not let the attacker mint more admins.
create policy "read own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.has_role('staff'));
create policy "owner manages roles" on public.user_roles
  for all to authenticated using (public.has_role('owner')) with check (public.has_role('owner'));

-- ── enrollments — granted by the Stripe webhook (service role) or an admin.
create policy "read own enrollments" on public.enrollments
  for select to authenticated using (user_id = auth.uid() or public.has_role('staff'));
create policy "admin manage enrollments" on public.enrollments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- CURRICULUM — THE ACCESS CONTROL SYSTEM
--
-- These policies are the product's entire security posture. Even if a lesson
-- ID leaks into a page, a query string, or an Expo deep link, the database
-- refuses to return the row. Hiding a link is not access control.
-- ============================================================================
create policy "published courses visible" on public.courses
  for select to anon, authenticated using (published);
create policy "admin manage courses" on public.courses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "published modules visible" on public.modules
  for select to anon, authenticated using (published);
create policy "admin manage modules" on public.modules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Anonymous visitors and un-enrolled students see PREVIEW lessons only.
create policy "preview lessons visible to all" on public.lessons
  for select to anon, authenticated using (published and is_preview);

-- The one that matters.
create policy "lessons at or below enrolled level" on public.lessons
  for select to authenticated
  using (published and level <= public.max_enrolled_level());

create policy "staff read all lessons" on public.lessons
  for select to authenticated using (public.has_role('staff'));
create policy "admin manage lessons" on public.lessons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- videos: readable only via a lesson the caller can already see.
create policy "videos for visible lessons" on public.videos
  for select to authenticated using (
    exists (select 1 from public.lessons l
            where l.video_id = public.videos.id
              and l.published
              and (l.is_preview or l.level <= public.max_enrolled_level()))
  );
create policy "admin manage videos" on public.videos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ── commerce
-- The pricing table is public (the website renders it). Transactions are not.
create policy "published plans readable" on public.membership_plans
  for select to anon, authenticated using (published);
create policy "admin manage plans" on public.membership_plans
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- No client INSERT: payments are created server-side after price resolution
-- and mutated only by the webhook.
create policy "read own payments" on public.payment_references
  for select to authenticated using (user_id = auth.uid() or public.has_role('staff'));
create policy "admin manage payments" on public.payment_references
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "read own membership" on public.memberships
  for select to authenticated using (user_id = auth.uid() or public.has_role('staff'));
create policy "admin manage memberships" on public.memberships
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "read own subscriptions" on public.subscriptions
  for select to authenticated using (user_id = auth.uid() or public.has_role('staff'));
create policy "admin manage subscriptions" on public.subscriptions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- stripe_events: NO policy at all. Service role only, permanently.
-- rate_limits:   NO policy at all. Service role only, permanently.

-- ── lesson_progress
-- The INSERT policy re-checks enrollment. Without it a user could seed progress
-- rows for unpurchased lessons and enumerate the catalogue by which inserts
-- succeed.
create policy "read own progress" on public.lesson_progress
  for select to authenticated using (user_id = auth.uid() or public.has_role('staff'));

create policy "insert own progress for accessible lessons" on public.lesson_progress
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.lessons l
                where l.id = lesson_id and l.published
                  and (l.is_preview or l.level <= public.max_enrolled_level()))
  );

create policy "update own progress" on public.lesson_progress
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── audit_records — read by admins, append-only for everyone.
create policy "admin read audit" on public.audit_records
  for select to authenticated using (public.is_admin());

-- ============================================================================
-- Function execution grants — lock down the SECURITY DEFINER surface.
-- ============================================================================
revoke all on function public.grant_enrollments_for_payment(uuid)  from public, anon, authenticated;
revoke all on function public.expire_stale_enrollments()           from public, anon, authenticated;
revoke all on function public.rate_limit_hit(text,integer,integer) from public, anon, authenticated;
revoke all on function public.write_audit(text,text,text,jsonb,inet,text) from public, anon;

grant execute on function public.max_enrolled_level(uuid)       to authenticated;
grant execute on function public.level_progress(smallint,uuid)  to authenticated;
grant execute on function public.has_role(public.app_role)      to authenticated;
grant execute on function public.is_admin()                     to authenticated;
