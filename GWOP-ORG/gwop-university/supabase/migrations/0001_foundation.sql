-- ============================================================================
-- 0001_foundation.sql — extensions, enums, university levels
--
-- CONVENTIONS ENFORCED THROUGHOUT ALL MIGRATIONS:
--   * RLS enabled + FORCED on every table, DEFAULT DENY. All policies live in
--     0006_rls.sql and nowhere else, so the whole access surface is one file.
--   * Money in integer minor units (cents). Never float.
--   * All timestamps timestamptz. The app never stores local time.
--   * Enums over free-text status columns, so a typo is a migration error
--     rather than a row nobody notices for three weeks.
--   * Every SECURITY DEFINER function pins search_path. An unpinned one is a
--     privilege-escalation vector, not a style preference.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "citext";

create type public.app_role          as enum ('student','staff','admin','owner');
create type public.level_slug        as enum ('freshman','sophomore','junior','senior');
create type public.enrollment_source as enum ('purchase','subscription','manual_grant','scholarship','founding_member','event_offer');
create type public.enrollment_status as enum ('active','expired','revoked','pending');
create type public.lesson_kind       as enum ('video','pdf','worksheet','link','quiz');
create type public.progress_status   as enum ('not_started','in_progress','completed');
create type public.payment_status    as enum ('pending','paid','failed','refunded','partially_refunded','canceled');
create type public.billing_mode      as enum ('one_time','subscription');

create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

-- ---------------------------------------------------------------------------
-- university_levels — the 4-level pathway (Visual Build Package p.4).
-- Data, not a hardcoded array, so the marketing site, the portal and the Expo
-- app render labels from ONE source. Mirrors src/content/pathway.ts and the
-- SKUs already declared in src/config/membership.ts.
-- ---------------------------------------------------------------------------
create table public.university_levels (
  level       smallint primary key check (level between 1 and 4),
  slug        public.level_slug not null unique,
  label       text not null,
  role_label  text not null,
  goal        text not null,
  detail      text not null,
  sku         text not null unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger university_levels_set_updated_at before update on public.university_levels
  for each row execute function public.tg_set_updated_at();

insert into public.university_levels (level, slug, label, role_label, goal, detail, sku) values
  (1,'freshman','Freshman','Foundation','Build the foundation','Credit · cash flow · banking · debt','GWOPU-FRESHMAN'),
  (2,'sophomore','Sophomore','Readiness','Become capital-ready','Business setup · records · funding readiness','GWOPU-SOPHOMORE'),
  (3,'junior','Junior','Build + Scale','Build + scale','Revenue · capital · systems · protection','GWOPU-JUNIOR'),
  (4,'senior','Senior','Legacy','Protect + legacy','Assets · investing · estate · long-term wealth','GWOPU-SENIOR');

alter table public.university_levels enable row level security;
alter table public.university_levels force  row level security;
