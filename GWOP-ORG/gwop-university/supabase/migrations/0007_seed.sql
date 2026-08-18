-- ============================================================================
-- 0007_seed.sql — development + staging seed
--
-- Seeded from src/content/modules.ts so nothing Maui and Sheena have already
-- produced is lost in the move to the database. Their flat level→module array
-- becomes course → module → lesson here; their entries are lessons.
--
-- ⚠ DEVELOPMENT AND STAGING ONLY. Guarded below so a stray run against
--   production cannot invent published content or a free enrollment.
--
-- WHY THIS MATTERS FOR TESTING: without seed rows every query returns an empty
-- array and every test passes for the wrong reason. A green suite against an
-- empty database proves nothing about access control.
-- ============================================================================

do $$
begin
  if current_setting('app.environment', true) = 'production' then
    raise exception 'refusing to seed production';
  end if;
end $$;

-- ── Courses: one per level, Freshman as the master template ────────────────
insert into public.courses (level, slug, title, summary, sort_order, published) values
  (1,'freshman-foundation','Freshman · Foundation','Credit, cash flow, banking and debt.',1,true),
  (2,'sophomore-readiness','Sophomore · Readiness','Business setup, records and funding readiness.',2,true),
  (3,'junior-build-scale','Junior · Build + Scale','Revenue, capital, systems and protection.',3,false),
  (4,'senior-legacy','Senior · Legacy','Assets, investing, estate and long-term wealth.',4,false)
on conflict (slug) do nothing;

-- ── Modules ────────────────────────────────────────────────────────────────
insert into public.modules (course_id, level, slug, title, sort_order, published)
select c.id, c.level, m.slug, m.title, m.ord, m.pub
from public.courses c
join (values
  ('freshman-foundation','credit-and-cash-flow','Credit &amp; Cash Flow',1::smallint,true),
  ('sophomore-readiness','capital-readiness','Capital Readiness',1::smallint,true),
  ('junior-build-scale','revenue-and-capital','Revenue &amp; Capital',1::smallint,false),
  ('senior-legacy','assets-and-legacy','Assets &amp; Legacy',1::smallint,false)
) as m(course_slug, slug, title, ord, pub) on m.course_slug = c.slug
on conflict (course_id, slug) do nothing;

-- ── Lessons — mirrors src/content/modules.ts exactly ───────────────────────
-- `is_preview` on the first Freshman lesson only: that is the one currently
-- shipped as free: true. Everything else requires an enrollment.
insert into public.lessons (module_id, level, slug, title, kind, sort_order, duration_sec, is_preview, published)
select mo.id, mo.level, l.slug, l.title, l.kind::public.lesson_kind, l.ord, l.secs, l.preview, l.pub
from public.modules mo
join (values
  ('credit-and-cash-flow','credit-foundations','Credit Foundations','video',1::smallint,840,false,true),
  ('credit-and-cash-flow','reading-your-report','Reading Your Report','video',2::smallint,1080,false,true),
  ('credit-and-cash-flow','cash-flow-basics','Cash Flow Basics','video',3::smallint,960,false,false),
  ('credit-and-cash-flow','banking-and-debt','Banking and Debt','video',4::smallint,1260,false,false),
  ('capital-readiness','business-setup','Business Setup','video',1::smallint,1320,false,true),
  ('capital-readiness','records-that-hold-up','Records That Hold Up','video',2::smallint,1140,false,false),
  ('capital-readiness','funding-readiness','Funding Readiness','video',3::smallint,1440,false,false),
  ('revenue-and-capital','revenue-systems','Revenue Systems','video',1::smallint,1200,false,false),
  ('revenue-and-capital','accessing-capital','Accessing Capital','video',2::smallint,1560,false,false),
  ('revenue-and-capital','protection','Protection','video',3::smallint,1020,false,false),
  ('assets-and-legacy','assets-and-investing','Assets and Investing','video',1::smallint,1380,false,false),
  ('assets-and-legacy','estate-and-legacy','Estate and Legacy','video',2::smallint,1500,false,false)
) as l(module_slug, slug, title, kind, ord, secs, preview, pub) on l.module_slug = mo.slug
on conflict (module_id, slug) do nothing;

-- ── Membership plans ───────────────────────────────────────────────────────
-- published = false throughout, mirroring PRICING_PUBLISHED = false in
-- src/config/membership.ts. No number renders and no checkout succeeds until
-- Surpaul approves. Amounts below are TEST DATA and must not be quoted.
insert into public.membership_plans
  (sku, name, grants_level, grants_cumulative, billing, amount_cents, published, sort_order)
values
  ('GWOPU-FRESHMAN','Freshman',1,true,'one_time',null,false,1),
  ('GWOPU-SOPHOMORE','Sophomore',2,true,'one_time',null,false,2),
  ('GWOPU-JUNIOR','Junior',3,true,'one_time',null,false,3),
  ('GWOPU-SENIOR','Senior',4,true,'one_time',null,false,4),
  ('GWOPU-BLUEPRINT-ALL','The Complete GWOP Blueprint',4,true,'one_time',null,false,5)
on conflict (sku) do nothing;
