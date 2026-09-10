-- ═══════════════════════════════════════════════════════════════════════════
-- 0015_purchase_acknowledgement.sql
-- Records what the buyer was shown and agreed to, at the moment they agreed.
--
-- ⚠ WHY THIS EXISTS: a no-refund policy is not enforceable by stating it. Card
-- networks allow a cardholder to dispute regardless of our terms. What decides
-- a dispute is evidence that the buyer was told, and agreed, before paying.
-- "It was linked in the footer" is weak. "They ticked a box, here is the exact
-- sentence and the timestamp" is not.
--
-- ⚠ THE WORDING IS STORED, NOT JUST THE FACT OF AGREEMENT. Six months from now
-- the question is what THAT person agreed to, not what the page says then. This
-- mirrors the pattern already used for SMS consent on `leads`, which stores
-- consent_text, consent_text_version, consent_ip and consent_at for the same
-- reason.
--
-- ⚠ ack_version IS THE LOAD-BEARING COLUMN. The wording may change once counsel
-- answers on CROA — if any part of the offer is caught by it, the sentence
-- becomes a three-day cancellation right rather than "non-refundable, immediate
-- access". When that happens, older purchases must still resolve to the wording
-- they actually saw. The version is how.
--
-- Columns are nullable because rows are created at checkout START, before
-- Stripe returns. The application requires the acknowledgement before creating
-- the row at all, so in practice they are always populated — but a NOT NULL
-- constraint here would break the retry path where an abandoned pending row is
-- reused.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

alter table public.payment_references
  add column if not exists ack_text        text,
  add column if not exists ack_version     text,
  add column if not exists ack_at          timestamptz,
  add column if not exists ack_ip          inet,
  add column if not exists ack_user_agent  text;

comment on column public.payment_references.ack_text is
  'Verbatim sentence the buyer ticked to agree to, as displayed. Never edit a '
  'stored value — add a new version instead.';
comment on column public.payment_references.ack_version is
  'Which revision of the acknowledgement wording was shown. Set from '
  'config/purchase.ts. Required to answer "what did this person agree to".';
comment on column public.payment_references.ack_ip is
  'Best-effort. Behind a CDN or VPN this is the last hop, not necessarily the '
  'buyer — evidence of a connection, not proof of identity.';

-- Index only where an acknowledgement exists. A dispute is always looked up
-- from a Stripe reference, so this supports the evidence query without
-- carrying every abandoned pending row.
create index if not exists payment_references_ack_at_idx
  on public.payment_references (ack_at desc)
  where ack_at is not null;

commit;

-- ── The dispute evidence query ────────────────────────────────────────────
-- One query, everything needed to respond. Kept here rather than in the
-- application because it is used under time pressure by whoever is handling
-- the dispute, not by the app.
--
--   select
--     p.stripe_payment_intent_id,
--     pr.email,
--     pr.full_name,
--     mp.name                        as bought,
--     p.amount_cents / 100.0         as amount,
--     p.currency,
--     p.paid_at,
--     p.ack_at                       as agreed_at,
--     p.ack_version,
--     p.ack_text                     as agreed_to,
--     p.ack_ip,
--     pr.last_seen_at                as last_signed_in,
--     min(lp.first_started_at)       as first_opened_a_lesson,
--     count(lp.id) filter (where lp.status = 'completed') as lessons_completed
--   from public.payment_references p
--   join public.profiles pr          on pr.id = p.user_id
--   join public.membership_plans mp  on mp.id = p.plan_id
--   left join public.lesson_progress lp on lp.user_id = p.user_id
--   where p.stripe_payment_intent_id = '<pi_...>'
--   group by 1,2,3,4,5,6,7,8,9,10,11,12;
--
-- ⚠ first_opened_a_lesson is the answer to the commonest dispute reason, which
-- is "not received" rather than "I want a refund". No-refund terms do not
-- address that claim; an access log does.
-- ═══════════════════════════════════════════════════════════════════════════
