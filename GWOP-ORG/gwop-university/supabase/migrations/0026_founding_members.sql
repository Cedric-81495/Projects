-- ════════════════════════════════════════════════════════════════════════════
-- 0026 — FOUNDING MEMBER REGISTER
--
-- Master Build & Launch Requirements, "Founding Member System":
--   · Deduplicate by email: trim, lowercase, collapse sub-addresses
--   · Award status once per unique person, not per registration
--   · Run the retroactive batch for 30 Aug – 14 Sep registrants through the
--     dedupe rule first
--   · Enforce the 30 Sep cutoff server-side — not in UI copy alone
--   · Confirm cutoff timezone: 11:59pm Eastern
--
-- ⚠ WHAT THIS DELIBERATELY DOES NOT DECIDE: what the status is worth.
-- Whether founding members get pricing, promotions, early access or something
-- else is Surpaul's call and the wording is still with counsel ("founding-
-- member pricing, promotions, and benefits on eligible products", with nothing
-- implying free-for-life). None of that changes WHO qualifies, which is what
-- this file settles.
--
-- Separating the two is the point: the register can be built and the batch run
-- now, while the benefit is still undecided, and the cutoff cannot quietly
-- pass while everyone waits for wording.
-- ════════════════════════════════════════════════════════════════════════════

begin;

-- ── 1 · THE NORMALISATION RULE ─────────────────────────────────────────────
-- ⚠ THIS FUNCTION IS THE DEDUPE. Everything else is bookkeeping.
--
-- citext already handles case, so `A@B.com` and `a@b.com` are the same value
-- today. What it does NOT handle is sub-addressing — `jo+gwop@gmail.com` is a
-- different string from `jo@gmail.com` but the same inbox, and the same person
-- registering twice. At an event, with a QR code and a phone, that is not an
-- edge case: it is what people do when they are not sure the first one worked.
--
-- ⚠ THE DOT RULE IS GMAIL-ONLY AND THAT IS NOT A SHORTCUT. Gmail ignores dots
-- in the local part, so `j.o@gmail.com` reaches `jo@gmail.com`. Almost nobody
-- else does — at many providers those are two different people, and stripping
-- dots globally would merge two strangers into one and award the status to
-- whichever registered first. Applying it only to the domains that document
-- the behaviour is the difference between deduplicating and losing somebody.
create or replace function public.normalize_email(p_email text)
returns text language sql immutable
set search_path = public, pg_catalog as $func$
  -- ⚠ NO CTE AND NO COLUMN NAMED `full`. `full` is reserved in Postgres —
  -- `select full from parts` is read as the start of a FULL JOIN and fails
  -- with 42601. Written flat instead: three expressions, no subqueries,
  -- nothing to alias.
  select case
    when split_part(lower(btrim(p_email)), '@', 2) = ''
      then lower(btrim(p_email))                      -- malformed; leave it alone
    when split_part(lower(btrim(p_email)), '@', 2) in ('gmail.com', 'googlemail.com')
      then replace(split_part(split_part(lower(btrim(p_email)), '@', 1), '+', 1), '.', '')
           || '@gmail.com'
    else split_part(split_part(lower(btrim(p_email)), '@', 1), '+', 1)
         || '@' || split_part(lower(btrim(p_email)), '@', 2)
  end;
$func$;

comment on function public.normalize_email(text) is
  'Collapses one person''s email variants to a single key: trims, lowercases, '
  'drops +sub-addressing, and for Gmail only, removes dots and folds '
  'googlemail.com. Used for Founding Member dedupe.';

-- ── 2 · THE REGISTER ───────────────────────────────────────────────────────
-- One row per PERSON, not per registration. The unique constraint on
-- email_normalized is what enforces "award status once per unique person" —
-- a rule in code is a rule somebody can forget to call.
create table if not exists public.founding_members (
  id                uuid primary key default gen_random_uuid(),

  -- The dedupe key. Generated, so it cannot drift from the address it came
  -- from and cannot be set by hand to something that does not match.
  email_normalized  text generated always as (public.normalize_email(email::text)) stored,
  email             citext not null,

  -- Who they were when they registered. Kept for the record, not for matching.
  first_name        text,
  last_name         text,

  -- ⚠ THE MOMENT THAT DECIDES ELIGIBILITY, not when the row was written. The
  -- retroactive batch inserts rows today for people who registered on 30 Aug,
  -- and their eligibility is judged on that date, not on the batch run.
  qualified_at      timestamptz not null,

  -- Where it came from: 'lead' (the 830 form), 'signup', 'manual'.
  source            text not null default 'lead',
  -- The originating row, so an award can be traced back. Nullable: a manual
  -- addition has no lead.
  lead_id           uuid references public.leads(id) on delete set null,
  user_id           uuid references public.profiles(id) on delete set null,

  -- ⚠ FALSE UNTIL THE BENEFIT IS AGREED AND THE WORDING CLEARED. Qualifying is
  -- a fact about a date; being awarded is a promise about a product. Do not
  -- flip this in bulk until counsel has returned the Founding Member terms.
  awarded           boolean not null default false,
  awarded_at        timestamptz,

  note              text,
  created_at        timestamptz not null default now(),

  constraint founding_awarded_consistency
    check (not awarded or awarded_at is not null)
);

create unique index if not exists founding_members_email_uniq
  on public.founding_members (email_normalized);

create index if not exists founding_members_qualified_idx
  on public.founding_members (qualified_at);

-- ── 3 · THE CUTOFF, IN ONE PLACE ───────────────────────────────────────────
-- ⚠ 11:59pm EASTERN, WHICH IS NOT UTC AND NOT A FIXED OFFSET. On 30 September
-- Eastern is EDT (UTC-4), so the deadline is 2026-10-01 03:59:59Z. Hard-coding
-- either the offset or a UTC timestamp would be right this year and wrong the
-- moment the date moves either side of a DST boundary. Postgres knows the
-- zone; let it do the arithmetic.
--
-- ⚠ INCLUSIVE OF THE LAST SECOND. 11:59pm means 23:59:59 is in, 00:00:00 is
-- out. Somebody registering at 11:59:30pm on the last night is exactly the
-- person this window exists for.
create or replace function public.founding_member_cutoff()
returns timestamptz language sql immutable
set search_path = public, pg_catalog as $$
  select (timestamp '2026-09-30 23:59:59' at time zone 'America/New_York');
$$;

comment on function public.founding_member_cutoff() is
  'The Founding Member deadline: 30 Sep 2026, 11:59pm America/New_York. '
  'Server-side source of truth — UI copy must read from this, never restate it.';

-- ── 4 · QUALIFY SOMEBODY, IDEMPOTENTLY ─────────────────────────────────────
-- Returns true if this call created the row, false if the person already held
-- the status or missed the window. Safe to call repeatedly — which matters,
-- because it is called from the lead path where a retry is normal.
create or replace function public.qualify_founding_member(
  p_email      text,
  p_first_name text default null,
  p_last_name  text default null,
  p_qualified_at timestamptz default now(),
  p_source     text default 'lead',
  p_lead_id    uuid default null
)
returns boolean language plpgsql security definer
set search_path = public, pg_catalog as $$
declare
  -- ⚠ INTEGER, NOT BOOLEAN. GET DIAGNOSTICS returns a row count; assigning it
  -- to a boolean raises at runtime, not at creation, so it would have failed
  -- on the first real lead rather than here.
  v_rows integer;
begin
  -- ⚠ THE WINDOW IS CHECKED HERE, IN THE DATABASE. The master doc is explicit:
  -- "Enforce the 30 Sep cutoff server-side — not in UI copy alone." A deadline
  -- only a webpage knows about is not a deadline.
  if p_qualified_at > public.founding_member_cutoff() then
    return false;
  end if;

  insert into public.founding_members (email, first_name, last_name, qualified_at, source, lead_id)
  values (p_email, p_first_name, p_last_name, p_qualified_at, p_source, p_lead_id)
  -- ⚠ EARLIEST REGISTRATION WINS. If the same person appears twice, the row
  -- keeps the first qualifying moment rather than the latest — they were a
  -- founding member from the day they first registered.
  on conflict (email_normalized) do nothing;

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

-- ── 5 · RLS ────────────────────────────────────────────────────────────────
alter table public.founding_members enable row level security;

-- Staff read; nobody writes through the API. Rows are created by
-- qualify_founding_member(), which is security definer.
create policy "staff read founding members" on public.founding_members
  for select using (public.has_role('staff'));

commit;

-- ════════════════════════════════════════════════════════════════════════════
-- THE RETROACTIVE BATCH — run once, deliberately, NOT part of the migration.
--
-- The master doc: "Run the retroactive batch for 30 Aug–14 Sep registrants
-- through the dedupe rule first."
--
-- ⚠ READ THE PREVIEW BEFORE RUNNING THE INSERT. The counts should differ —
-- that gap IS the duplicates, and seeing it is the only confirmation that the
-- dedupe did anything.
--
--   -- Preview: how many rows, how many people
--   select count(*) as registrations,
--          count(distinct public.normalize_email(email::text)) as unique_people
--     from public.leads
--    where created_at >= '2026-08-30' and created_at < '2026-09-15';
--
--   -- See the duplicates it will collapse
--   select public.normalize_email(email::text) as person,
--          array_agg(email::text order by created_at) as variants,
--          min(created_at) as first_seen
--     from public.leads
--    where created_at >= '2026-08-30' and created_at < '2026-09-15'
--    group by 1 having count(*) > 1;
--
--   -- The batch. distinct on + order by picks each person's FIRST registration.
--   insert into public.founding_members (email, first_name, last_name, qualified_at, source, lead_id)
--   select distinct on (public.normalize_email(l.email::text))
--          l.email, l.first_name, l.last_name, l.created_at, 'lead', l.id
--     from public.leads l
--    where l.created_at >= '2026-08-30' and l.created_at < '2026-09-15'
--    order by public.normalize_email(l.email::text), l.created_at
--   on conflict (email_normalized) do nothing;
--
-- VERIFY
--
--   -- A. Every row is inside the window. Expect zero:
--   select count(*) from public.founding_members
--    where qualified_at > public.founding_member_cutoff();
--
--   -- B. The cutoff resolves to the right instant. Expect 2026-10-01 03:59:59+00:
--   select public.founding_member_cutoff();
--
--   -- C. The normaliser behaves. Expect all four to read jo@gmail.com:
--   select public.normalize_email('Jo@Gmail.com'),
--          public.normalize_email(' jo+gwop@gmail.com '),
--          public.normalize_email('j.o@googlemail.com'),
--          public.normalize_email('JO@gmail.com');
--
--   -- D. And that it does NOT strip dots elsewhere. Expect two different values:
--   select public.normalize_email('j.o@outlook.com'),
--          public.normalize_email('jo@outlook.com');
-- ════════════════════════════════════════════════════════════════════════════
