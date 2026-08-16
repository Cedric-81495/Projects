-- ============================================================================
-- 0005_progress_audit.sql — progress, audit, rate limiting
--
-- ⚠ NOTE THE ABSENCE OF A `leads` TABLE.
--   Earlier project guides specified a write-first leads table with /api/lead.
--   The approved architecture (§4, §28) forbids a second lead database:
--   GoHighLevel is the sole system of record for event leads. This is a
--   deliberate removal, not an omission. See ARCHITECTURE.md §14.1 for the
--   trade-off that was accepted.
--
-- lesson_progress covers both §12 `progress` and §12 `completion`. Completion
-- is a state of progress; two tables would let them disagree.
-- ============================================================================

create table public.lesson_progress (
  user_id          uuid not null references public.profiles(id) on delete cascade,
  lesson_id        uuid not null references public.lessons(id) on delete cascade,
  status           public.progress_status not null default 'not_started',
  position_sec     integer not null default 0 check (position_sec >= 0),
  watched_sec      integer not null default 0 check (watched_sec >= 0),
  completed_at     timestamptz,
  first_started_at timestamptz,
  last_device      text,                 -- 'web' | 'ios' | 'android'
  updated_at       timestamptz not null default now(),
  primary key (user_id, lesson_id),
  constraint progress_completed_consistency
    check (status <> 'completed' or completed_at is not null)
);
create index lesson_progress_user_idx on public.lesson_progress (user_id, updated_at desc);
create trigger lesson_progress_set_updated_at before update on public.lesson_progress
  for each row execute function public.tg_set_updated_at();

-- Level completion is COMPUTED, never stored, so it cannot disagree with the
-- underlying rows. This is what "resume where you left off" reads on both
-- the website and the Expo app.
create or replace function public.level_progress(p_level smallint, uid uuid default auth.uid())
returns table (total integer, completed integer, percent smallint)
language sql stable security definer
set search_path = public, pg_catalog as $$
  select count(*)::int,
         count(*) filter (where lp.status = 'completed')::int,
         case when count(*) = 0 then 0
              else round(100.0 * count(*) filter (where lp.status='completed') / count(*))::smallint
         end
  from public.lessons l
  left join public.lesson_progress lp on lp.lesson_id = l.id and lp.user_id = uid
  where l.level = p_level and l.published;
$$;

-- ---------------------------------------------------------------------------
-- audit_records — append-only. There is deliberately no UPDATE or DELETE
-- policy for anyone, including owners. An audit trail that can be edited is
-- not an audit trail.
-- ---------------------------------------------------------------------------
create table public.audit_records (
  id          bigserial primary key,
  occurred_at timestamptz not null default now(),
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_role  public.app_role,
  action      text not null,      -- 'enrollment.grant', 'lesson.playback_issued', …
  entity      text not null,
  entity_id   text,
  ip          inet,
  user_agent  text,
  metadata    jsonb not null default '{}'::jsonb
);
create index audit_actor_idx  on public.audit_records (actor_id, occurred_at desc);
create index audit_action_idx on public.audit_records (action, occurred_at desc);

create or replace function public.write_audit(
  p_action text, p_entity text, p_entity_id text default null,
  p_metadata jsonb default '{}'::jsonb, p_ip inet default null, p_ua text default null)
returns void language plpgsql security definer
set search_path = public, pg_catalog as $$
begin
  insert into public.audit_records (actor_id, actor_role, action, entity, entity_id, ip, user_agent, metadata)
  values (auth.uid(),
          (select max(role)::public.app_role from public.user_roles where user_id = auth.uid()),
          p_action, p_entity, p_entity_id, p_ip, p_ua, p_metadata);
end;
$$;

-- ---------------------------------------------------------------------------
-- rate_limits — Postgres fallback for the edge limiter. Fixed window: coarse,
-- but cheap and predictable. Exists so "Redis is unreachable" cannot silently
-- mean "the API is now unlimited".
-- ---------------------------------------------------------------------------
create table public.rate_limits (
  bucket_key   text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (bucket_key, window_start)
);
create index rate_limits_gc_idx on public.rate_limits (window_start);

create or replace function public.rate_limit_hit(
  p_key text, p_limit integer, p_window_seconds integer)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql security definer
set search_path = public, pg_catalog as $$
declare v_start timestamptz; v_hits integer;
begin
  v_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.rate_limits (bucket_key, window_start, hits)
  values (p_key, v_start, 1)
  on conflict (bucket_key, window_start) do update set hits = public.rate_limits.hits + 1
  returning hits into v_hits;
  return query select v_hits <= p_limit, greatest(p_limit - v_hits, 0),
                      v_start + make_interval(secs => p_window_seconds);
end;
$$;

alter table public.lesson_progress enable row level security;
alter table public.audit_records   enable row level security;
alter table public.rate_limits     enable row level security;
alter table public.lesson_progress force row level security;
alter table public.audit_records   force row level security;
alter table public.rate_limits     force row level security;
