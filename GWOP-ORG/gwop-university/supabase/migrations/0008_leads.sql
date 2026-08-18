-- ═══════════════════════════════════════════════════════════════════════════
-- 0008_leads.sql
--
-- Event lead capture, written server-side before forwarding to GoHighLevel.
--
-- SUPERSEDES the "no leads table" rule in ARCHITECTURE.md §14.1. Felicia
-- approved this on Aug 18: save the signup server-side first, forward to GHL
-- with retries, GHL remains the operational CRM and marketing source of truth.
--
-- The distinction matters and is worth stating plainly:
--   · This table is the RECORD OF SUBMISSION — proof of what was entered, when,
--     from which QR code, and what consent language was shown.
--   · GHL is where leads are WORKED — tags, pipeline, nurture, attribution.
-- This is not a competing CRM and must not grow into one.
-- ═══════════════════════════════════════════════════════════════════════════

create type public.lead_sync_status as enum (
  'pending',   -- accepted, not yet forwarded
  'synced',    -- GHL accepted it
  'failed'     -- retries exhausted; needs a human
);

create table public.leads (
  id            uuid primary key default gen_random_uuid(),

  -- ── Identity ────────────────────────────────────────────────────────────
  first_name    text not null,
  last_name     text,
  email         citext not null,
  -- E.164 only. Normalised by libphonenumber-js before it reaches here, so a
  -- booth typo like 09686795190 is either corrected or rejected at the edge
  -- rather than stored as an unusable string.
  phone         text not null,

  -- ── What they asked for ─────────────────────────────────────────────────
  -- Not a foreign key: INTERESTS lives in config/integrations.ts and Felicia
  -- may reword a tag mid-campaign. A stale value must not break a signup.
  interest      text not null default 'unspecified',
  -- Jake's tag text, verbatim, so his workflow matches on it directly rather
  -- than us keeping a lookup table in sync with his.
  interest_tag  text,

  -- ── Attribution ─────────────────────────────────────────────────────────
  source        text,                    -- ?s= — which QR code / booth role
  utm           jsonb not null default '{}'::jsonb,
  referer       text,

  -- ── Consent (TCPA record) ───────────────────────────────────────────────
  -- consent_text stores the EXACT sentence shown at the time, not a reference
  -- to it. Wording will change; the record of what someone agreed to must not.
  consent_given boolean not null,
  consent_text  text    not null,
  consent_at    timestamptz not null default now(),
  consent_ip    inet,
  user_agent    text,

  -- ── Forwarding state ────────────────────────────────────────────────────
  sync_status   public.lead_sync_status not null default 'pending',
  sync_attempts smallint not null default 0,
  synced_at     timestamptz,
  last_error    text,
  -- GHL's contact id once it comes back, so a duplicate submission updates
  -- rather than creating a second contact.
  ghl_contact_id text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Marketing SMS without consent is not a lead, it is a liability.
  constraint leads_consent_required check (consent_given),
  -- A failure must say why. Silent 'failed' rows are unactionable.
  constraint leads_failure_explained check (
    sync_status <> 'failed' or last_error is not null
  ),
  constraint leads_synced_has_timestamp check (
    sync_status <> 'synced' or synced_at is not null
  )
);

-- The retry cron's only query: oldest pending first, cheap under load.
create index leads_pending_idx
  on public.leads (created_at)
  where sync_status = 'pending';

-- Booth duplicates are near-certain — someone submits, walks away unsure it
-- worked, comes back. Not a unique constraint: a second submission with a
-- different interest is real information, and rejecting it at the table would
-- look broken to the attendee.
create index leads_phone_idx on public.leads (phone);
create index leads_email_idx on public.leads (email);

create trigger leads_set_updated_at before update on public.leads
  for each row execute function public.tg_set_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────
-- Deny by default. No anon insert: the browser never touches this table, it
-- posts to /api/lead, which writes with the service role after Turnstile and
-- rate limiting. An anon insert policy would be an open endpoint into the
-- client's lead list.
alter table public.leads enable row level security;

-- Staff read for the booth counter and post-event attribution.
create policy leads_admin_read on public.leads
  for select using (public.has_role('admin'));

comment on table public.leads is
  'Record of event signup submissions. GHL remains the operational CRM (Felicia, Aug 18). Not a second CRM.';
