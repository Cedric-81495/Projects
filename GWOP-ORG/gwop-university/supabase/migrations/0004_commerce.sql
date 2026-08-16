-- ============================================================================
-- 0004_commerce.sql — Stripe (§16)
--
-- RULES THIS SCHEMA EXISTS TO ENFORCE:
--  1. The client never sends a price. It sends a SKU; the server resolves the
--     Stripe price from membership_plans. A tampered request buys the same
--     thing at the same price.
--  2. Access is granted by the WEBHOOK, never by the success redirect. A
--     success URL is a UI event, not a payment — anyone can navigate to it.
--  3. Every Stripe event ID is recorded before processing. Stripe retries;
--     double-granting is prevented by a unique index, not by hoping the
--     handler is fast enough.
--
-- membership_plans mirrors src/config/membership.ts: LEVELS[].sku,
-- BLUEPRINT_BUNDLE, CAPABILITIES.oneTimePayment / monthlyPayment.
-- ============================================================================

create table public.membership_plans (
  id                   uuid primary key default gen_random_uuid(),
  sku                  text not null unique,      -- 'GWOPU-FRESHMAN', …
  name                 text not null,
  description          text,

  grants_level         smallint not null references public.university_levels(level),
  grants_cumulative    boolean not null default true,   -- Junior also grants 1–2
  access_days          integer,                          -- null = perpetual

  billing              public.billing_mode not null default 'one_time',
  stripe_price_id_test text,
  stripe_price_id_live text,

  amount_cents         integer check (amount_cents is null or amount_cents >= 0),
  currency             char(3) not null default 'USD',

  -- Mirrors PRICING_PUBLISHED. While false the plan is never rendered with a
  -- number and cannot be checked out. Surpaul's approval is a data change.
  published            boolean not null default false,
  sort_order           smallint not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  constraint plans_sku_format check (sku ~ '^[A-Z0-9]+(-[A-Z0-9]+)*$'),
  -- Cannot publish a plan with no price or no Stripe price to charge against.
  constraint plans_publishable check (
    not published
    or (amount_cents is not null
        and coalesce(stripe_price_id_live, stripe_price_id_test) is not null)
  )
);
create trigger membership_plans_set_updated_at before update on public.membership_plans
  for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- payment_references (§12) — one row per purchase attempt.
-- ---------------------------------------------------------------------------
create table public.payment_references (
  id                         uuid primary key default gen_random_uuid(),
  user_id                    uuid not null references public.profiles(id) on delete restrict,
  plan_id                    uuid not null references public.membership_plans(id) on delete restrict,

  status                     public.payment_status not null default 'pending',
  amount_cents               integer not null check (amount_cents >= 0),
  amount_refunded_cents      integer not null default 0 check (amount_refunded_cents >= 0),
  currency                   char(3) not null default 'USD',

  stripe_checkout_session_id text unique,
  stripe_payment_intent_id   text unique,
  stripe_customer_id         text,

  -- Client-supplied, so a double-tapped Buy button on a flaky connection
  -- produces ONE checkout session rather than two charges.
  idempotency_key            text not null,

  paid_at                    timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),

  constraint payments_refund_bounds check (amount_refunded_cents <= amount_cents),
  constraint payments_paid_consistency check (status <> 'paid' or paid_at is not null)
);
create unique index payments_idempotency_uniq on public.payment_references (user_id, idempotency_key);
create index payments_user_idx on public.payment_references (user_id, created_at desc);
create index payments_pending_idx on public.payment_references (status) where status = 'pending';
create trigger payment_references_set_updated_at before update on public.payment_references
  for each row execute function public.tg_set_updated_at();

alter table public.enrollments
  add constraint enrollments_payment_fk foreign key (payment_reference_id)
  references public.payment_references(id) on delete set null;

-- ---------------------------------------------------------------------------
-- memberships — the student's current plan state, denormalised for fast reads
-- on the portal shell. Derived from enrollments + subscriptions; never the
-- source of truth for access.
-- ---------------------------------------------------------------------------
create table public.memberships (
  user_id      uuid primary key references public.profiles(id) on delete cascade,
  plan_id      uuid references public.membership_plans(id) on delete set null,
  level        smallint not null default 0,
  active       boolean not null default false,
  renews_at    timestamptz,
  updated_at   timestamptz not null default now()
);

create table public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references public.profiles(id) on delete restrict,
  plan_id                uuid not null references public.membership_plans(id) on delete restrict,
  stripe_subscription_id text not null unique,
  stripe_customer_id     text not null,
  status                 text not null,        -- mirrors Stripe verbatim
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id);
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- stripe_events — idempotency ledger. Written BEFORE the handler runs.
-- ---------------------------------------------------------------------------
create table public.stripe_events (
  id           text primary key,             -- Stripe's evt_… id
  type         text not null,
  payload      jsonb not null,
  received_at  timestamptz not null default now(),
  processed_at timestamptz,
  error        text,
  attempts     smallint not null default 0
);
create index stripe_events_unprocessed_idx on public.stripe_events (received_at)
  where processed_at is null;

-- ---------------------------------------------------------------------------
-- grant_enrollments_for_payment — the ONLY path from money to access.
-- Idempotent and row-locking, because Stripe will deliver the same event twice.
-- ---------------------------------------------------------------------------
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
            case when v_plan.billing = 'subscription' then 'subscription' else 'purchase' end,
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

create or replace function public.expire_stale_enrollments()
returns integer language sql security definer
set search_path = public, pg_catalog as $$
  with updated as (
    update public.enrollments set status = 'expired', updated_at = now()
    where status = 'active' and expires_at is not null and expires_at <= now()
    returning 1
  ) select count(*)::int from updated;
$$;

alter table public.membership_plans   enable row level security;
alter table public.payment_references enable row level security;
alter table public.memberships        enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.stripe_events      enable row level security;
alter table public.membership_plans   force row level security;
alter table public.payment_references force row level security;
alter table public.memberships        force row level security;
alter table public.subscriptions      force row level security;
alter table public.stripe_events      force row level security;
