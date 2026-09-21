-- ════════════════════════════════════════════════════════════════════════════
-- 0027 — RECORD THE UPGRADE CREDIT
--
-- Pricing, Payment & Package Master, "The upgrade credit — this is what
-- replaces the payment plan":
--
--   "Someone buys one level and later wants the bundle. Credit the earlier
--    purchase in full. You collect $997 either way rather than more. That is
--    deliberate."
--
-- One column. `amount_cents` stays the price actually charged, because that is
-- what reconciles against Stripe and what a refund must return. This records
-- what was taken off, which nothing else can reconstruct afterwards:
--
--   · the buyer's enrollments change over time, so recomputing the credit from
--     what they own today gives a different answer next month
--   · level prices may move, so the arithmetic is not reproducible either
--   · a dispute six months from now needs the figure as it stood on the day
--
-- ⚠ CENTS, AND NEVER NEGATIVE. Stored as the amount deducted — a positive
-- number. Storing it as a negative charge would make every sum of amount_cents
-- silently wrong.
-- ════════════════════════════════════════════════════════════════════════════

begin;

alter table public.payment_references
  add column if not exists credit_applied_cents integer not null default 0
  check (credit_applied_cents >= 0);

comment on column public.payment_references.credit_applied_cents is
  'Upgrade credit deducted at checkout, in cents. 0 for every ordinary '
  'purchase. amount_cents remains the amount actually charged.';

-- Finding credited purchases later, without scanning the table.
create index if not exists payments_credited_idx
  on public.payment_references (user_id, created_at desc)
  where credit_applied_cents > 0;

commit;

-- ════════════════════════════════════════════════════════════════════════════
-- VERIFY — run separately.
--
-- A. The column exists, defaults to 0, and is not null:
--
--      select column_name, column_default, is_nullable
--        from information_schema.columns
--       where table_schema = 'public'
--         and table_name = 'payment_references'
--         and column_name = 'credit_applied_cents';
--
-- B. Nothing historical was credited. Expect zero rows:
--
--      select count(*) from public.payment_references where credit_applied_cents > 0;
--
-- C. After the first credited upgrade, this is the audit view — what was
--    charged, what was taken off, and what the two add up to:
--
--      select pr.created_at, mp.sku,
--             pr.amount_cents, pr.credit_applied_cents,
--             pr.amount_cents + pr.credit_applied_cents as list_price
--        from public.payment_references pr
--        join public.membership_plans mp on mp.id = pr.plan_id
--       where pr.credit_applied_cents > 0
--       order by pr.created_at desc;
--
--    `list_price` should equal the bundle's amount_cents on every row. If it
--    does not, the credit and the charge have drifted apart and the discount
--    is no longer reconstructible.
-- ════════════════════════════════════════════════════════════════════════════
