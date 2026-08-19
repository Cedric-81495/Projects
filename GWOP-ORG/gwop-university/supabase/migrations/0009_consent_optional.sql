-- ═══════════════════════════════════════════════════════════════════════════
-- 0009_consent_optional.sql
--
-- SMS consent becomes OPTIONAL. Jake, 2026-08-19:
--   "the phone number can be required, but the SMS consent checkbox should be
--    optional and unchecked by default"
--
-- The approved wording itself says so: "Consent is not a condition of
-- purchase." Requiring the box would contradict the sentence beside it, and
-- would cost signups at the booth from people who want the Blueprint but not
-- the texts.
--
-- 0008 shipped with `leads_consent_required check (consent_given)`, which
-- rejects exactly that lead. Dropping it here rather than editing 0008,
-- because 0008 has already been applied to the live database.
--
-- WHAT DOES NOT CHANGE: consent_text is still NOT NULL. A declined lead is
-- still evidence — it records the exact sentence the person was shown and
-- chose not to accept. That distinction matters if anyone ever asks whether
-- they were given the option.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.leads drop constraint if exists leads_consent_required;

comment on column public.leads.consent_given is
  'Did the attendee tick the SMS consent box? FALSE is a valid, capturable lead — consent is not a condition of signup (Jake, 2026-08-19). Jake''s workflow branches on this.';

comment on column public.leads.consent_text is
  'The exact sentence shown beside the checkbox at submission time, stored whether or not it was accepted. Wording changes between campaigns; this row must remain evidence of what THIS person saw.';
