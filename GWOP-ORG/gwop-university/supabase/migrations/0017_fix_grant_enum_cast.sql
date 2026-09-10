-- ═══════════════════════════════════════════════════════════════════════════
-- 0017_fix_grant_enum_cast.sql
-- grant_enrollments_for_payment() has never once succeeded. This is why.
--
-- ⚠ THE BUG, in 0004 line 25:
--
--     case when v_plan.billing = 'subscription' then 'subscription'
--          else 'purchase' end
--
-- A CASE returning bare string literals resolves to `text`. `enrollments.source`
-- is the `enrollment_source` enum, and Postgres will not implicitly cast text
-- to an enum in an INSERT target. Every call raised:
--
--     42804: column "source" is of type enrollment_source but expression is
--            of type text
--
-- ⚠ WHY NOBODY NOTICED FOR THREE WEEKS. Checkout was never open, so the
-- function was never called by a real purchase. Every enrollment in the
-- database was written by hand with source = 'manual_grant', which bypasses
-- this code path entirely. The first genuine purchase found it immediately.
--
-- ⚠ AND IT WAS MADE UNRECOVERABLE BY THE WEBHOOK'S ORDERING. The handler
-- records the Stripe event id in `stripe_events` before the grant runs, so the
-- failing delivery still marked the event processed. Stripe's retry then hit
-- the idempotency guard, logged `stripe_event_replay`, and returned 2xx without
-- doing anything. Result: payment_references says `paid`, the event says
-- handled, and no enrollment exists — and no amount of retrying fixes it.
--
-- That ordering is a separate defect. Fixing it means recording the event id
-- only after the work completes, or recording it with a status the retry can
-- re-attempt. Not changed here: this migration restores the grant so purchases
-- work, and the ordering wants its own change with its own testing.
--
-- ── THE FIX ───────────────────────────────────────────────────────────────
-- One explicit cast. Everything else in the function is reproduced verbatim
-- from 0004 — the row locks, the cumulative/exact level selection, the
-- extend-never-shorten conflict clause and the memberships upsert are all
-- correct and are not touched.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.grant_enrollments_for_payment(p_payment_id uuid)
returns void language plpgsql security definer
set search_path = public, pg_catalog as $$
declare
  v_pay  public.payment_references%rowtype;
  v_plan public.membership_plans%rowtype;
  v_expires timestamptz;
  v_level smallint;
begin
  select * into v_pay from public.payment_references where id = p_payment_id for update;
  if not found then raise exception 'payment % not found', p_payment_id; end if;
  if v_pay.status <> 'paid' then
    raise exception 'refusing to grant access for payment % in status %', p_payment_id, v_pay.status;
  end if;

  select * into v_plan from public.membership_plans where id = v_pay.plan_id;

  /* ⚠ ADDED 2026-09-10. 0004 had no guard here, so an orphaned plan_id left
     v_plan entirely NULL — and then the level loop below evaluates
     `case when NULL ...`, matches no rows, and the function returns having
     granted nothing. Silent, and indistinguishable from success.

     Raising instead means the webhook throws, Stripe retries, and somebody
     sees it. A grant that quietly does nothing is the worst outcome here. */
  if not found then
    raise exception 'payment % references plan % which does not exist',
      p_payment_id, v_pay.plan_id;
  end if;

  v_expires := case when v_plan.access_days is null then null
                    else now() + make_interval(days => v_plan.access_days) end;

  for v_level in
    select l.level from public.university_levels l
    where case when v_plan.grants_cumulative
               then l.level <= v_plan.grants_level
               else l.level  = v_plan.grants_level end
  loop
    insert into public.enrollments (user_id, level, source, status, payment_reference_id, expires_at)
    values (v_pay.user_id, v_level,
            /* ⚠ THE CAST IS THE ENTIRE FIX. Without ::public.enrollment_source
               this CASE is `text` and the insert fails with 42804. Do not
               remove it, and do not "simplify" the CASE back to bare literals. */
            (case when v_plan.billing = 'subscription' then 'subscription'
                  else 'purchase' end)::public.enrollment_source,
            'active', v_pay.id, v_expires)
    on conflict (user_id, level) where status = 'active'
    do update set
      -- Re-purchase EXTENDS access; it never shortens it.
      expires_at = case
        when public.enrollments.expires_at is null or excluded.expires_at is null then null
        else greatest(public.enrollments.expires_at, excluded.expires_at) end,
      payment_reference_id = excluded.payment_reference_id,
      updated_at = now();
  end loop;

  insert into public.memberships (user_id, plan_id, level, active, renews_at, updated_at)
  values (v_pay.user_id, v_plan.id, v_plan.grants_level, true, v_expires, now())
  on conflict (user_id) do update set
    plan_id = excluded.plan_id,
    level = greatest(public.memberships.level, excluded.level),
    active = true, renews_at = excluded.renews_at, updated_at = now();
end;
$$;

-- ── Recover the purchases this bug lost ───────────────────────────────────
-- Any payment already marked `paid` whose enrollment never landed. Safe to
-- re-run: the function is idempotent and the conflict clause extends rather
-- than duplicates.
--
--   select public.grant_enrollments_for_payment(p.id)
--     from public.payment_references p
--    where p.status = 'paid'
--      and not exists (
--        select 1 from public.enrollments e
--         where e.payment_reference_id = p.id
--      );
--
-- Then confirm:
--
--   select e.level, e.status, e.source, e.payment_reference_id, pr.email
--     from public.enrollments e
--     join public.profiles pr on pr.id = e.user_id
--    where e.source in ('purchase','subscription')
--    order by pr.email, e.level;
--
-- ⚠ The $297 payment is still `pending` — its webhook delivery never updated
-- it. That one needs the event resending from Stripe AFTER this migration is
-- applied, and its `stripe_events` row deleted first, or the replay guard will
-- skip it the same way.
-- ═══════════════════════════════════════════════════════════════════════════
