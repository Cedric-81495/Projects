-- ============================================================================
-- 0003_curriculum.sql — courses → modules → lessons → videos
--
-- Four levels of hierarchy per §14. The existing src/content/modules.ts is a
-- flat level→module array; its entries are really LESSONS and are seeded as
-- such in 0007, so nothing Maui and Sheena have produced is lost.
--
-- ⚠ NO MEDIA BYTES IN POSTGRES. `videos` holds Bunny identifiers only.
--   Paid PDFs live in a PRIVATE Supabase Storage bucket, never in public/.
-- ============================================================================

create table public.courses (
  id         uuid primary key default gen_random_uuid(),
  level      smallint not null references public.university_levels(level),
  slug       text not null unique,
  title      text not null,
  summary    text,
  sort_order smallint not null default 0,
  published  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
create index courses_level_idx on public.courses (level, sort_order);
create trigger courses_set_updated_at before update on public.courses
  for each row execute function public.tg_set_updated_at();

create table public.modules (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses(id) on delete cascade,
  level      smallint not null references public.university_levels(level),
  slug       text not null,
  title      text not null,
  description text,
  sort_order smallint not null,
  published  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint modules_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  unique (course_id, slug),
  unique (course_id, sort_order)
);
create index modules_level_idx on public.modules (level, sort_order);
create trigger modules_set_updated_at before update on public.modules
  for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- lessons — the unit a student actually opens.
--
-- `level` is denormalised from the course DELIBERATELY: the RLS policy on this
-- table must not join to another RLS-protected table to decide access. Kept
-- honest by triggers below rather than by developer discipline.
-- ---------------------------------------------------------------------------
create table public.lessons (
  id             uuid primary key default gen_random_uuid(),
  module_id      uuid not null references public.modules(id) on delete cascade,
  level          smallint not null references public.university_levels(level),
  slug           text not null,
  title          text not null,
  description    text,
  kind           public.lesson_kind not null,
  sort_order     smallint not null,

  video_id       uuid,                  -- FK added after videos exists
  storage_path   text,                  -- PRIVATE bucket key (pdf / worksheet)
  external_url   text,                  -- kind = 'link' only
  workbook_path  text,                  -- accompanying PDF, private bucket
  duration_sec   integer check (duration_sec is null or duration_sec >= 0),

  is_preview     boolean not null default false,   -- openable without enrollment
  is_capstone    boolean not null default false,   -- The Completed GWOP Blueprint
  published      boolean not null default false,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint lessons_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  unique (module_id, slug),
  unique (module_id, sort_order),

  -- One and only one source. Prevents a 'link' lesson quietly also carrying a
  -- storage_path that some future code path serves unguarded.
  constraint lessons_single_source check (
      (case when video_id     is not null then 1 else 0 end)
    + (case when storage_path is not null then 1 else 0 end)
    + (case when external_url is not null then 1 else 0 end) <= 1
  ),
  constraint lessons_kind_source check (
    (kind = 'video' and external_url is null)
    or (kind in ('pdf','worksheet') and video_id is null)
    or (kind = 'link' and video_id is null and storage_path is null)
    or  kind = 'quiz'
  ),
  -- Cannot publish an empty lesson.
  constraint lessons_publishable check (
    not published
    or coalesce(video_id::text, storage_path, external_url) is not null
    or kind = 'quiz'
  )
);
create index lessons_level_idx  on public.lessons (level, sort_order);
create index lessons_module_idx on public.lessons (module_id, sort_order);
create index lessons_published_idx on public.lessons (published) where published;
create trigger lessons_set_updated_at before update on public.lessons
  for each row execute function public.tg_set_updated_at();

-- ---------------------------------------------------------------------------
-- videos — Bunny Stream metadata. No bytes, no URLs, no signed tokens stored.
-- A stored signed URL is a credential sitting in a database with a long TTL.
-- ---------------------------------------------------------------------------
create table public.videos (
  id             uuid primary key default gen_random_uuid(),
  bunny_library_id text not null,
  bunny_video_id   text not null,      -- Bunny GUID
  title          text not null,
  duration_sec   integer check (duration_sec is null or duration_sec >= 0),
  thumbnail_path text,
  width          smallint,
  height         smallint,
  status         text not null default 'pending',   -- mirrors Bunny encoding state
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (bunny_library_id, bunny_video_id)
);
create trigger videos_set_updated_at before update on public.videos
  for each row execute function public.tg_set_updated_at();

alter table public.lessons
  add constraint lessons_video_fk foreign key (video_id)
  references public.videos(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Keep denormalised levels in lockstep. If this drifts, access control drifts
-- with it — so the database maintains it, not the application.
-- ---------------------------------------------------------------------------
create or replace function public.tg_sync_module_level()
returns trigger language plpgsql security definer
set search_path = public, pg_catalog as $$
begin
  select c.level into new.level from public.courses c where c.id = new.course_id;
  if new.level is null then
    raise exception 'module references unknown course %', new.course_id;
  end if;
  return new;
end;
$$;
create trigger modules_sync_level before insert or update of course_id on public.modules
  for each row execute function public.tg_sync_module_level();

create or replace function public.tg_sync_lesson_level()
returns trigger language plpgsql security definer
set search_path = public, pg_catalog as $$
begin
  select m.level into new.level from public.modules m where m.id = new.module_id;
  if new.level is null then
    raise exception 'lesson references unknown module %', new.module_id;
  end if;
  return new;
end;
$$;
create trigger lessons_sync_level before insert or update of module_id on public.lessons
  for each row execute function public.tg_sync_lesson_level();

-- Moving a course between levels carries its modules and lessons with it.
create or replace function public.tg_cascade_course_level()
returns trigger language plpgsql security definer
set search_path = public, pg_catalog as $$
begin
  if new.level is distinct from old.level then
    update public.modules set level = new.level where course_id = new.id;
    update public.lessons  set level = new.level
      where module_id in (select id from public.modules where course_id = new.id);
  end if;
  return new;
end;
$$;
create trigger courses_cascade_level after update of level on public.courses
  for each row execute function public.tg_cascade_course_level();

alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.videos  enable row level security;
alter table public.courses force row level security;
alter table public.modules force row level security;
alter table public.lessons force row level security;
alter table public.videos  force row level security;
