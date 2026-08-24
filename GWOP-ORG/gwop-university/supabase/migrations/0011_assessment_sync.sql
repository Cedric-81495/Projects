-- ═══════════════════════════════════════════════════════════════════════════
-- 0011_assessment_sync.sql
--
-- Sync tracking for forwarding completed assessments to GoHighLevel.
--
-- Mirrors the columns already on `leads` rather than inventing a second
-- pattern. Jake supplied a second inbound webhook on 2026-08-25, so the
-- assessment now travels separately from the contact — the contact reaches him
-- at form submit, the answers about a minute later when they submit the review.
--
-- Same reasoning as leads: a forward that fails must be retryable, and the
-- reason it failed must be readable without going through server logs.
-- ═══════════════════════════════════════════════════════════════════════════

create type public.assessment_sync_status as enum ('pending', 'synced', 'failed');

alter table public.assessments
  add column sync_status   public.assessment_sync_status not null default 'pending',
  add column sync_attempts integer not null default 0,
  add column synced_at     timestamptz,
  add column last_error    text;

-- The retry query: completed assessments that have not reached Jake yet.
-- Partial rows are excluded deliberately — an unfinished assessment has not
-- been submitted, so there is nothing to forward.
create index assessments_sync_pending_idx
  on public.assessments (sync_status, created_at)
  where sync_status = 'pending' and status = 'complete';

comment on column public.assessments.sync_status is
  'Forwarding state to GHL. pending until the assessment is completed AND '
  'delivered; failed once retries are exhausted and a human should look.';
