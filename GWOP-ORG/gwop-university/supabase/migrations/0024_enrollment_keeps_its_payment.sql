-- ════════════════════════════════════════════════════════════════════════════
-- 0024 — AN ENROLLMENT STAYS LINKED TO THE PAYMENT THAT BOUGHT IT
--
-- One line removed from the conflict clause in
-- grant_enrollments_for_payment(). Everything else is reproduced verbatim from
-- 0017 — the row locks, the plan guard, the enum cast, the level selection,
-- the extend-never-shorten rule and the memberships upsert are all correct and
-- are not touched.
--
-- ── THE DEFECT ─────────────────────────────────────────────────────────────
-- The conflict clause ended with:
--
--     payment_reference_id = excluded.payment_reference_id
--
-- So when a grant touches a level the buyer ALREADY holds, that existing
-- enrollment stops pointing at the payment that bought it and starts pointing
-- at the newest one.
--
-- The webhook revokes refunded access by payment_reference_id
-- (app/api/webhooks/stripe/route.ts, charge.refunded). Put those together:
--
--   1. Buyer purchases Level 2 ($297) and Level 3 ($397). Two enrollments,
--      each linked to its own payment.
--   2. Buyer later purchases the bundle. The grant loops all four levels.
--      Levels 1 and 4 insert. Levels 2 and 3 hit the conflict clause and are
--      re-pointed at the bundle payment.
--   3. The bundle charge is disputed and Stripe refunds it.
--   4. The handler revokes every enrollment carrying that payment id — and
--      takes Levels 2 and 3 with it. $694 of separately-purchased, never-
--      refunded access, gone.
--
-- ⚠ "WE DO NOT DO REFUNDS" IS NOT A DEFENCE. A chargeback is a refund the
-- bank performs without asking, and charge.refunded already handles it. The
-- no-refund policy makes this MORE likely to fire, not less, because a buyer
-- with no refund route goes to their bank instead.
--
-- ⚠ NOT REACHABLE TODAY, AND THAT IS WHY IT IS BEING FIXED NOW.
-- bundleIsBestDeal() hides the bundle from anyone holding Level 3 or 4, and
-- checkout now refuses it outright (lib/stripe/checkout.ts step 1b). The
-- moment the upgrade credit ships and the bundle is sold to existing owners,
-- this becomes live. Fixing it while nobody is affected costs nothing.
--
-- ── THE FIX ────────────────────────────────────────────────────────────────
-- Drop the assignment. An enrollment keeps the payment_reference_id it was
-- created with, for the lifetime of that enrollment.
--
-- ⚠ DO NOT "RESTORE" IT. It looks like a harmless freshness update. It is the
-- line that lets one payment adopt another payment's access.
--
-- Re-purchase still extends expiry — that clause is untouched, and it is the
-- part that actually matters for renewals.
-- ════════════════════════════════════════════════════════════════════════════

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

  /* Orphaned plan_id would leave v_plan NULL and the loop below would match no
     rows — granting nothing, silently, indistinguishable from success. See the
     note in 0017. */
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
            /* ⚠ THE CAST IS LOAD-BEARING. Without ::public.enrollment_source
               this CASE is `text` and the insert fails with 42804. Do not
               remove it, and do not "simplify" the CASE back to bare literals.
               See 0017 — this function did not work at all until it was added. */
            (case when v_plan.billing = 'subscription' then 'subscription'
                  else 'purchase' end)::public.enrollment_source,
            'active', v_pay.id, v_expires)
    on conflict (user_id, level) where status = 'active'
    do update set
      -- Re-purchase EXTENDS access; it never shortens it.
      expires_at = case
        when public.enrollments.expires_at is null or excluded.expires_at is null then null
        else greatest(public.enrollments.expires_at, excluded.expires_at) end,
      /* ⚠ payment_reference_id IS DELIBERATELY NOT UPDATED HERE — 0024.
         The row keeps the payment that bought it, so a refund of a LATER
         payment cannot revoke access this one paid for. Read the header
         before adding it back. */
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

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFY — run separately. Not part of the migration.
--
-- A. The assignment is gone from the function body. Expect ZERO rows:
--
--      select 1
--        from pg_proc
--       where proname = 'grant_enrollments_for_payment'
--         and prosrc like '%payment_reference_id = excluded.payment_reference_id%';
--
-- B. No existing enrollment has already been adopted by a later payment.
--    Every active enrollment should carry a payment whose plan actually grants
--    that level. Expect ZERO rows; anything here predates this fix and wants a
--    decision, not a script:
--
--      select e.user_id, e.level, mp.sku, mp.grants_level, mp.grants_cumulative
--        from public.enrollments e
--        join public.payment_references pr on pr.id = e.payment_reference_id
--        join public.membership_plans   mp on mp.id = pr.plan_id
--       where e.status = 'active'
--         and case when mp.grants_cumulative
--                  then e.level > mp.grants_level
--                  else e.level <> mp.grants_level end;
-- ════════════════════════════════════════════════════════════════════════════
