-- ============================================================================
-- 0002_identity_access.sql — profiles, roles, enrollments
--
-- THE CORE SECURITY IDEA:
--   Authorization is a property of the DATABASE, not the UI and not the API.
--   The website and the Expo app hit the same tables through the same policies,
--   so a bug in one client cannot widen access in the other.
--
--   Two independent axes, kept separate on purpose:
--     ROLE       — what kind of user you are      (student/staff/admin/owner)
--     ENROLLMENT — which levels you may open      (1..4, with expiry)
--
--   An admin is not automatically enrolled in paid content, and a student who
--   buys Senior gains no administrative power.
-- ============================================================================

create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            citext not null,
  full_name        text,
  phone_e164       text,
  avatar_path      text,                    -- private bucket key, never a URL
  marketing_opt_in boolean not null default false,
  onboarded_at     timestamptz,
  last_seen_at     timestamptz,
  deleted_at       timestamptz,             -- soft delete keeps the audit trail
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint profiles_phone_format
    check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{6,14}$')
);

create unique index profiles_email_uniq on public.profiles (email) where deleted_at is null;
create index profiles_phone_idx on public.profiles (phone_e164) where phone_e164 is not null;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- user_roles — deliberately a separate table, NOT a column on profiles.
-- profiles is self-updatable; a role column there is a privilege-escalation
-- hole waiting for the first lazy `update profiles set ...` policy.
-- ---------------------------------------------------------------------------
create table public.user_roles (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       public.app_role not null,
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);
create index user_roles_role_idx on public.user_roles (role);

-- ---------------------------------------------------------------------------
-- enrollments — the answer to "which levels may this person open?"
-- Expiry is honoured in SQL, not in the client.
-- ---------------------------------------------------------------------------
create table public.enrollments (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  level                smallint not null references public.university_levels(level),
  source               public.enrollment_source not null,
  status               public.enrollment_status not null default 'active',
  payment_reference_id uuid,                 -- FK added in 0004
  granted_by           uuid references public.profiles(id) on delete set null,
  starts_at            timestamptz not null default now(),
  expires_at           timestamptz,          -- null = perpetual
  note                 text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint enrollments_window check (expires_at is null or expires_at > starts_at)
);

-- One active enrollment per level per user; re-purchase extends, never duplicates.
create unique index enrollments_active_uniq on public.enrollments (user_id, level)
  where status = 'active';
create index enrollments_user_idx on public.enrollments (user_id);
create index enrollments_expiring_idx on public.enrollments (expires_at)
  where status = 'active' and expires_at is not null;
create trigger enrollments_set_updated_at before update on public.enrollments
  for each row execute function public.tg_set_updated_at();

-- ============================================================================
-- AUTHORIZATION FUNCTIONS
-- SECURITY DEFINER + pinned search_path so RLS policies can call them without
-- re-entering RLS and recursing.
-- ============================================================================

create or replace function public.current_role_rank()
returns smallint language sql stable security definer
set search_path = public, pg_catalog as $$
  select coalesce(max(case r.role
    when 'owner' then 40 when 'admin' then 30 when 'staff' then 20 when 'student' then 10
  end), 0)::smallint
  from public.user_roles r where r.user_id = auth.uid();
$$;

create or replace function public.has_role(required public.app_role)
returns boolean language sql stable security definer
set search_path = public, pg_catalog as $$
  select public.current_role_rank() >= case required
    when 'owner' then 40 when 'admin' then 30 when 'staff' then 20 when 'student' then 10
  end;
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = public, pg_catalog as $$ select public.has_role('admin'); $$;

-- The single most important function in the codebase.
-- Highest level the caller may open right now. 0 = nothing.
create or replace function public.max_enrolled_level(uid uuid default auth.uid())
returns smallint language sql stable security definer
set search_path = public, pg_catalog as $$
  select coalesce(max(e.level), 0)::smallint
  from public.enrollments e
  where e.user_id = uid
    and e.status = 'active'
    and e.starts_at <= now()
    and (e.expires_at is null or e.expires_at > now());
$$;

-- ---------------------------------------------------------------------------
-- New-user bootstrap. In a trigger rather than the app, so a user can never
-- exist in auth.users without a profile and a role — no matter which client
-- (website or Expo) signed them up.
-- ---------------------------------------------------------------------------
create or replace function public.tg_handle_new_user()
returns trigger language plpgsql security definer
set search_path = public, pg_catalog as $$
begin
  insert into public.profiles (id, email, full_name, phone_e164)
  values (new.id, new.email,
          nullif(new.raw_user_meta_data ->> 'full_name',''),
          nullif(new.raw_user_meta_data ->> 'phone',''))
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, 'student')
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.tg_handle_new_user();

alter table public.profiles    enable row level security;
alter table public.user_roles  enable row level security;
alter table public.enrollments enable row level security;
alter table public.profiles    force row level security;
alter table public.user_roles  force row level security;
alter table public.enrollments force row level security;
