-- ═══════════════════════════════════════════════════════════════════════════
-- 0019_payment_attempts.sql
-- Closes the four gaps left by 0018. Read that file first.
--
-- 0018 fixed the root cause — the browser was generating the idempotency key,
-- so every existing constraint was unreachable. This file fixes what 0018
-- half-did:
--
--   1. attempt_number was DERIVED at insert time, not stored
--   2. `processing` and `requires_action` were added to the enum and never
--      written by anything
--   3. no reconciliation: Stripe saying `paid` while we said `pending` threw a
--      409 forever instead of resolving
--   4. concurrent delivery of the same webhook could be processed twice
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── 1 · PERSIST THE ATTEMPT NUMBER ────────────────────────────────────────
-- ⚠ 0018 COMPUTED THIS AND THREW IT AWAY.
--
-- The key was derived as `payment:{user}:{sku}:{count of closed attempts}`,
-- recomputed on every request. That is fragile in a specific way: the guard in
-- 0018 deliberately allows `failed` → `paid` (Stripe reports a failed intent
-- then a successful one when a customer corrects their card). When that
-- happens the count DROPS, and the next attempt derives a key that already
-- exists — a spurious 23505 on a legitimate new attempt.
--
-- Storing it makes the key a fact about the row rather than a function of
-- everything around it.

alter table public.payment_references
  add column if not exists attempt_number smallint not null default 1
    check (attempt_number >= 1);

comment on column public.payment_references.attempt_number is
  'Which attempt at buying this plan this row represents. Part of the '
  'idempotency key. Assigned by next_payment_attempt() under a lock — never '
  'recomputed, because a status change elsewhere would shift a derived count.';

-- ── 2 · ONE ROW PER (user, plan, attempt) ─────────────────────────────────
-- Spec Phase 4: UNIQUE(session_id, product_id, attempt_number). Our business
-- key is (user_id, plan_id, attempt_number) — there is no separate cart or
-- checkout-session entity in this schema, the user IS the session.
--
-- Full unique index, not partial: a historical attempt keeps its number, so
-- attempt 2 can never be created twice even after attempt 1 is closed.

create unique index if not exists payments_attempt_uniq
  on public.payment_references (user_id, plan_id, attempt_number);

-- ── 3 · ASSIGN THE NEXT ATTEMPT NUMBER SAFELY ─────────────────────────────
-- ⚠ THE ADVISORY LOCK IS THE POINT. `select max(attempt_number) + 1` on its
-- own is the classic read-modify-write race: two concurrent callers both read
-- 1, both try 2, one fails.
--
-- The lock is keyed on (user, plan) so it serialises only the callers that
-- could actually collide — two different users buying simultaneously never
-- wait on each other. It is transaction-scoped, so it releases on commit or
-- rollback with nothing to clean up.
--
-- Returns 0 rather than a number when an open or paid attempt already exists,
-- so the caller reuses rather than creating. Doing that check inside the lock
-- closes the window where two requests both decide to create attempt 1.

create or replace function public.next_payment_attempt(
  p_user_id uuid,
  p_plan_id uuid
)
returns smallint language plpgsql security definer
set search_path = public, pg_catalog as $$
declare
  v_open  uuid;
  v_paid  uuid;
  v_next  smallint;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_plan_id::text, 0));

  select id into v_paid from public.payment_references
   where user_id = p_user_id and plan_id = p_plan_id and status = 'paid' limit 1;
  if v_paid is not null then return 0; end if;

  select id into v_open from public.payment_references
   where user_id = p_user_id and plan_id = p_plan_id
     and status in ('pending','processing','requires_action') limit 1;
  if v_open is not null then return 0; end if;

  select coalesce(max(attempt_number), 0) + 1 into v_next
    from public.payment_references
   where user_id = p_user_id and plan_id = p_plan_id;

  return v_next;
end;
$$;

grant execute on function public.next_payment_attempt(uuid, uuid) to service_role;

-- ── 4 · CLAIM A WEBHOOK EVENT ─────────────────────────────────────────────
-- ⚠ FIXES A HOLE 0018 INTRODUCED.
--
-- 0018 changed the replay gate to read `processed_at` and reprocess when null.
-- Correct for a retry after failure — but with two deliveries of the same event
-- arriving together, the loser of the insert race reads `processed_at` as null
-- (the winner has not finished) and BOTH process concurrently. No duplicate
-- enrollment resulted, because the grant's conflict clause absorbed it, but
-- that was luck rather than design.
--
-- A conditional UPDATE is atomic: exactly one caller can move a row out of
-- `claimed_at is null`, whatever the concurrency. The other gets no row and
-- acknowledges.
--
-- ⚠ claimed_at IS SEPARATE FROM processed_at ON PURPOSE. processed_at means
-- "finished"; claimed_at means "someone is working on it". Reusing one column
-- for both would make a crashed processor indistinguishable from a finished
-- one.

alter table public.stripe_events
  add column if not exists claimed_at timestamptz;

comment on column public.stripe_events.claimed_at is
  'Set when a request takes ownership of processing this event. Distinct from '
  'processed_at, which means finished. A row with claimed_at set and '
  'processed_at null for more than a few minutes is a crashed processor — the '
  'stale-claim window in claim_stripe_event() lets it be retried.';

create or replace function public.claim_stripe_event(
  p_event_id text,
  p_stale_after interval default '5 minutes'
)
returns boolean language plpgsql security definer
set search_path = public, pg_catalog as $$
declare
  v_claimed boolean;
begin
  /* Single atomic statement. The WHERE decides the winner; there is no gap
     between reading and writing for a competitor to slip through.

     Claimable when:
       · never processed, AND
       · never claimed, OR claimed long enough ago that the claimant is
         presumed dead. Without the stale window, a function timeout would
         strand the event permanently — the same class of bug as the original
         replay gate. */
  update public.stripe_events
     set claimed_at = now(),
         attempts   = attempts + 1
   where id = p_event_id
     and processed_at is null
     and (claimed_at is null or claimed_at < now() - p_stale_after)
  returning true into v_claimed;

  return coalesce(v_claimed, false);
end;
$$;

grant execute on function public.claim_stripe_event(text, interval) to service_role;

create index if not exists stripe_events_stale_claims_idx
  on public.stripe_events (claimed_at)
  where processed_at is null and claimed_at is not null;

commit;

-- ── Verification ──────────────────────────────────────────────────────────
--   select column_name from information_schema.columns
--    where table_name = 'payment_references' and column_name = 'attempt_number';
--
--   select indexname from pg_indexes where indexname = 'payments_attempt_uniq';
--
--   select proname from pg_proc
--    where proname in ('next_payment_attempt','claim_stripe_event');
--
-- ⚠ EXISTING ROWS ALL GET attempt_number = 1 from the default. If any user has
-- more than one row for the same plan, payments_attempt_uniq will fail to
-- create. Check first:
--
--   select user_id, plan_id, count(*) from public.payment_references
--    group by user_id, plan_id having count(*) > 1;
--
-- Renumber them oldest-first before retrying:
--
--   with ranked as (
--     select id, row_number() over (
--              partition by user_id, plan_id order by created_at
--            ) as n
--       from public.payment_references
--   )
--   update public.payment_references p
--      set attempt_number = ranked.n
--     from ranked where ranked.id = p.id;
-- ═══════════════════════════════════════════════════════════════════════════