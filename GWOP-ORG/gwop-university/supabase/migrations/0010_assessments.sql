-- ═══════════════════════════════════════════════════════════════════════════
-- 0010_assessments.sql
--
-- The seven-question needs assessment, per Felicia's 2026-08-21 brief. 8/30 is
-- a beta test and needs assessment: the point is to learn what attendees
-- actually need, so these answers have to be QUERYABLE AS A SET.
--
-- That is why every answer is its own typed column rather than one jsonb blob.
-- "How many people under 580 also have no emergency fund" is the entire reason
-- this table exists, and jsonb makes every question of that shape harder than
-- it needs to be for no benefit we can name.
--
-- RELATIONSHIP TO `leads`:
--   · leads       — WHO submitted, with the consent record. Unchanged.
--   · assessments — WHAT they told us. One row per lead.
-- Q1 is deliberately NOT here: it is the interest question and already lives on
-- leads.interest / leads.interest_tag, which is the verbatim-tag contract with
-- Jake. Duplicating it would create two sources of truth for the same answer.
-- ═══════════════════════════════════════════════════════════════════════════

create type public.assessment_status as enum (
  'partial',   -- started, did not reach the end. Still real data.
  'complete'   -- all seven answered
);

create table public.assessments (
  id       uuid primary key default gen_random_uuid(),

  -- One assessment per lead. A second submission updates rather than stacking:
  -- someone who submits, walks away unsure it worked, and comes back should not
  -- produce two conflicting sets of answers.
  lead_id  uuid not null unique references public.leads(id) on delete cascade,

  -- ── The answers ────────────────────────────────────────────────────────
  -- EVERY ONE NULLABLE, deliberately. Contact is captured before the questions
  -- start, so someone who abandons at Q4 is a lead we can still follow up. A
  -- schema that refused a partial row would throw that away.
  --
  -- text, not enums. Felicia may reword an option mid-week and a stale value
  -- must never cost us a submission at the table. The allowed set is enforced
  -- in src/config/assessment.ts, which is also what renders the buttons — so
  -- the two cannot drift.
  financial_stage    text,  -- Q2 starting_over | getting_stable | building | ready_to_grow
  credit_range       text,  -- Q3 under_580 | 580_649 | 650_699 | 700_plus | unknown
  emergency_fund     text,  -- Q4 none | under_1_month | 1_to_3_months | 3_plus_months
  budget_status      text,  -- Q5 yes | sometimes | no
  currently_building text,  -- Q6 business | homeownership | investments | retirement | none_yet
  biggest_blocker    text,  -- Q7 debt | credit | income | knowledge | consistency | unsure

  -- ── What they were shown ───────────────────────────────────────────────
  -- Stored, not recomputed. The mapping in config/blueprint.ts will change, and
  -- when someone asks "what did this person actually see" months from now, a
  -- recomputed answer would be a guess. This is the record.
  blueprint_slug text,

  -- ── Provenance ─────────────────────────────────────────────────────────
  -- Which activation this came from. Earns its place immediately for reporting,
  -- and is the groundwork that lets these rows belong to an organisation later
  -- without a data archaeology exercise. See the multi-tenant note.
  event_key text not null default 'unknown',

  status       public.assessment_status not null default 'partial',
  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint assessments_complete_has_timestamp check (
    status <> 'complete' or completed_at is not null
  )
);

-- The reporting query: how far did people get, by event.
create index assessments_event_status_idx
  on public.assessments (event_key, status);

-- Answers arrive one at a time as the attendee taps through, so this row is
-- updated five or six times in ninety seconds. Cheap lookup by lead.
create index assessments_lead_idx on public.assessments (lead_id);

create trigger assessments_set_updated_at before update on public.assessments
  for each row execute function public.tg_set_updated_at();

-- ── RLS ────────────────────────────────────────────────────────────────────
-- Same posture as leads: default deny, no anon policy of any kind, admin read
-- only. Writes go through the service role in /api/assessment, which bypasses
-- RLS — which is exactly why the service key never leaves the server.
--
-- An anon INSERT policy would be the obvious shortcut here and it would be a
-- mistake: this endpoint is reachable from a printed QR code, so anyone in the
-- room can post to it.
alter table public.assessments enable row level security;
alter table public.assessments force row level security;

create policy "assessments readable by admin" on public.assessments
  for select to authenticated using (public.is_admin());

comment on table public.assessments is
  'Beta needs-assessment responses, 8/30 activation. Answers are nullable by '
  'design — partial responses are real data. Q1 lives on leads.interest.';
