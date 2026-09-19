/**
 * Self-test.
 *
 *   npx tsx scripts/verify.ts            # offline checks only
 *   npx tsx scripts/verify.ts --db       # also check Supabase (needs .env)
 *   npx tsx scripts/verify.ts --live     # also call the real job APIs
 *
 * Stage 1 runs the whole parse -> normalize -> validate -> dedupe pipeline
 * against captured responses. No network, no database, no configuration.
 * Stage 2 checks the schema and RPCs are in place. Stage 3 confirms the
 * source APIs still return the shape the connectors expect.
 *
 * Exits non-zero if any check fails, so it works in CI.
 */
import 'dotenv/config';
import { arbeitnowConnector } from '../src/lib/sources/arbeitnow';
import { greenhouseConnector } from '../src/lib/sources/greenhouse';
import { validateJobs } from '../src/lib/jobs/schema';
import { dedupeBatch, dedupeKeys } from '../src/lib/jobs/deduplicate';
import { canonicalUrl, coreTitle, jobFingerprint } from '../src/lib/jobs/fingerprint';
import { parseSalaryText, toAnnual } from '../src/lib/jobs/salary';
import { parseLocation, toEmploymentType, toWorkArrangement } from '../src/lib/jobs/normalize';
import { parseRobots, isAllowed } from '../src/lib/scraping/robots';
import { CrawlSession } from '../src/lib/scraping/http';
import type { SourceContext } from '../src/lib/sources/types';

let passed = 0;
let failed = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { passed++; console.log(`  PASS  ${label}`); }
  else { failed++; console.log(`  FAIL  ${label}\n          expected ${JSON.stringify(expected)}\n          actual   ${JSON.stringify(actual)}`); }
}

function ok(label: string, condition: boolean, detail = '') {
  if (condition) { passed++; console.log(`  PASS  ${label}`); }
  else { failed++; console.log(`  FAIL  ${label}${detail ? `\n          ${detail}` : ''}`); }
}

function ctx(): SourceContext {
  return {
    session: new CrawlSession('verify', {
      userAgent: 'verify', requestDelayMs: 0, maxRequestsPerRun: 5,
      maxPagesPerRun: 2, retryLimit: 0, respectRobots: false,
    }),
    config: {},
    log: () => {},
  };
}

// --- Fixtures: real record shapes captured from the live APIs -------------
const ARBEITNOW_FIXTURE = {
  slug: 'senior-backend-engineer-berlin-165284',
  company_name: 'ClickHouse Inc.',
  title: 'Senior Backend Engineer (m/w/d)',
  description: '<p>You will work with <strong>TypeScript</strong>, React, Kubernetes and PostgreSQL.</p><hr><p>Compensation: \u20ac90K \u2013 \u20ac160K</p>',
  remote: false,
  url: 'https://www.arbeitnow.com/jobs/companies/clickhouse/senior-backend-engineer-berlin-165284?utm_source=feed',
  tags: ['Engineering'],
  job_types: ['Full Time'],
  location: 'Berlin, Berlin; München, Bavaria',
  created_at: 1789774813,
};

const GREENHOUSE_FIXTURE = {
  id: 4567890,
  title: 'Backend Engineer II',
  absolute_url: 'https://boards.greenhouse.io/clickhouse/jobs/4567890?gh_src=abc',
  updated_at: '2026-09-15T10:00:00-04:00',
  first_published: null,
  location: { name: 'Berlin' },
  offices: [{ name: 'Remote - EU' }],
  departments: [{ name: 'Engineering' }],
  content: '&lt;p&gt;Build services in &lt;strong&gt;Go&lt;/strong&gt; and Kubernetes.&lt;/p&gt;',
  metadata: [{ name: 'Salary Range', value: '$120,000 - $160,000 per year' }],
};

function normalizeFixtures() {
  const c = ctx();
  const a = arbeitnowConnector.normalizeJob(arbeitnowConnector.parseJob(
    { ref: { externalJobId: `de:${ARBEITNOW_FIXTURE.slug}`, url: ARBEITNOW_FIXTURE.url },
      payload: { job: ARBEITNOW_FIXTURE, variant: { key: 'de', endpoint: '', country: 'Germany' } } } as any, c), c);
  const g = greenhouseConnector.normalizeJob(greenhouseConnector.parseJob(
    { ref: { externalJobId: 'clickhouse:4567890', url: GREENHOUSE_FIXTURE.absolute_url },
      payload: { job: GREENHOUSE_FIXTURE, board: { token: 'clickhouse', company: 'ClickHouse Inc.' } } } as any, c), c);
  return { a, g };
}

function stageOffline() {
  console.log('\nStage 1 — pipeline (no network, no database)\n');

  console.log('Arbeitnow connector');
  const { a, g } = normalizeFixtures();
  check('title preserved', a.title, 'Senior Backend Engineer (m/w/d)');
  check('employment type read from job_types', a.employmentType, 'full_time');
  check('city from multi-location string', a.city, 'Berlin');
  check('country from variant hint', a.country, 'Germany');
  check('salary read from Compensation line', [a.salaryMin, a.salaryMax, a.salaryCurrency, a.salaryPeriod],
    [90000, 160000, 'EUR', 'yearly']);
  ok('posted date taken from created_at', a.postedAt instanceof Date);
  ok('HTML decoded into plain text', (a.descriptionText ?? '').includes('TypeScript') && !(a.descriptionText ?? '').includes('<p>'));
  ok('skills extracted', a.skills.includes('typescript') && a.skills.includes('react'));

  console.log('\nGreenhouse connector');
  check('entity-escaped HTML decoded', (g.descriptionText ?? '').includes('Go') && !(g.descriptionText ?? '').includes('&lt;'), true);
  check('remote inferred from office name', g.workArrangement, 'remote');
  check('salary read from board metadata', [g.salaryMin, g.salaryMax, g.salaryCurrency], [120000, 160000, 'USD']);
  check('no posting date is null, NOT updated_at', g.postedAt, null);

  console.log('\nValidation');
  const valid = validateJobs([a, g, { sourceId: 'broken' }, { title: 'no source' }]);
  check('malformed records rejected', valid.length, 2);

  console.log('\nDeduplication');
  check('seniority + gender suffix stripped from title', coreTitle('Senior Backend Engineer (m/w/d)'), 'backend engineer');
  check('roman numerals stripped', coreTitle('Backend Engineer II'), 'backend engineer');
  const fpA = jobFingerprint({ companyName: 'ClickHouse Inc.', title: 'Senior Backend Engineer (m/w/d)', locationRaw: 'Berlin, Berlin; München, Bavaria' });
  const fpB = jobFingerprint({ companyName: 'Clickhouse', title: 'Backend Engineer II', locationRaw: 'Berlin' });
  ok('same job on two boards -> same fingerprint', fpA === fpB, `${fpA} vs ${fpB}`);
  ok('different job -> different fingerprint',
    fpA !== jobFingerprint({ companyName: 'ClickHouse Inc.', title: 'Frontend Engineer', locationRaw: 'Berlin' }));
  ok('tracking params + www + trailing slash ignored',
    canonicalUrl('https://www.example.com/jobs/1?utm_source=x&gh_src=y') === canonicalUrl('https://example.com/jobs/1/'));
  check('repeats removed inside a batch', dedupeBatch([a, a, g]).length, 2);
  ok('dedupe keys are stable', dedupeKeys(a).fingerprint === dedupeKeys(a).fingerprint);

  console.log('\nSalary parsing');
  check('K suffix + en dash', parseSalaryText('€90K – €160K'), { min: 90000, max: 160000, currency: 'EUR', period: 'yearly' });
  check('European thousands separator', parseSalaryText('90.000 - 120.000 EUR pro Jahr').min, 90000);
  check('hourly rate', parseSalaryText('25 USD/hour'), { min: 25, max: null, currency: 'USD', period: 'hourly' });
  check('no numbers -> no salary invented', parseSalaryText('Competitive salary'), { min: null, max: null, currency: null, period: null });
  check('missing salary stays null', parseSalaryText(null).min, null);
  check('hourly converted to annual for sorting', toAnnual(25, 'hourly'), 52000);

  console.log('\nShared vocabulary');
  check('German full-time', toEmploymentType('Vollzeit'), 'full_time');
  check('working student -> internship', toEmploymentType('Werkstudent'), 'internship');
  check('unknown stays "other", not guessed', toEmploymentType(null), 'other');
  check('hybrid beats a remote flag', toWorkArrangement({ remoteFlag: true, text: 'hybrid working policy' }), 'hybrid');
  check('no signal -> unknown', toWorkArrangement({ remoteFlag: null, location: null }), 'unknown');
  check('bare country is not a city', parseLocation('Germany').city, null);
  check('"Remote - EU" is not a city', parseLocation('Remote - EU').city, null);

  console.log('\nrobots.txt');
  const rules = parseRobots('User-agent: *\nDisallow: /private\nAllow: /private/public\nCrawl-delay: 2', 'JobFinderBot/0.1');
  check('crawl-delay read', rules.crawlDelayMs, 2000);
  check('disallowed path blocked', isAllowed(rules, 'https://x.com/private/thing'), false);
  check('more specific allow wins', isAllowed(rules, 'https://x.com/private/public/a'), true);
  check('unlisted path allowed', isAllowed(rules, 'https://x.com/jobs'), true);
}

async function stageDb() {
  console.log('\nStage 2 — database\n');
  let serviceClient, publicClient;
  try {
    ({ serviceClient, publicClient } = await import('../src/lib/db/supabase'));
  } catch (error) {
    failed++; console.log(`  FAIL  loading Supabase client: ${(error as Error).message}`); return;
  }

  let db;
  try { db = publicClient(); passed++; console.log('  PASS  environment variables present and valid'); }
  catch (error) { failed++; console.log(`  FAIL  environment: ${(error as Error).message}`); return; }

  for (const table of ['sources', 'companies', 'jobs']) {
    const { error } = await db.from(table).select('*', { count: 'exact', head: true });
    ok(`table "${table}" reachable`, !error, error?.message);
  }

  const sources = await db.from('sources').select('id');
  ok('migration 0002 seeded the sources', (sources.data?.length ?? 0) >= 2,
    `found ${sources.data?.length ?? 0}; run supabase/migrations/0002_seed_sources.sql`);

  const search = await db.rpc('search_jobs', { p_limit: 1 });
  ok('search_jobs() responds', !search.error, search.error?.message);

  const stats = await db.rpc('admin_stats');
  ok('admin_stats() responds', !stats.error, stats.error?.message);
  if (stats.data) {
    const s = stats.data as Record<string, number>;
    console.log(`        ${s.total_jobs} jobs stored, ${s.active_jobs} active, ${s.duplicate_jobs} duplicates`);
    if (s.total_jobs === 0) console.log('        (empty — run "npm run collect -- --all")');
  }

  try {
    serviceClient();
    passed++; console.log('  PASS  service role key present (writes will work)');
  } catch {
    failed++; console.log('  FAIL  SUPABASE_SERVICE_ROLE_KEY missing — collection cannot write');
  }
}

async function stageLive() {
  console.log('\nStage 3 — live source APIs\n');
  const c = ctx();
  try {
    const refs = await arbeitnowConnector.discoverJobs(c);
    ok('Arbeitnow returned jobs', refs.length > 0);
    if (refs.length) {
      const job = arbeitnowConnector.normalizeJob(
        arbeitnowConnector.parseJob(await arbeitnowConnector.fetchJob(refs[0], c), c), c);
      ok('Arbeitnow response still matches the expected shape',
        validateJobs([job]).length === 1);
      console.log(`        e.g. "${job.title}" at ${job.companyName}`);
    }
  } catch (error) {
    failed++; console.log(`  FAIL  Arbeitnow: ${(error as Error).message}`);
  }

  const boards = process.env.GREENHOUSE_BOARDS;
  if (!boards) {
    console.log('  SKIP  Greenhouse — set GREENHOUSE_BOARDS to test it');
  } else {
    try {
      const gc = ctx();
      const refs = await greenhouseConnector.discoverJobs(gc);
      ok(`Greenhouse returned jobs for ${boards}`, refs.length > 0);
      if (refs.length) {
        const job = greenhouseConnector.normalizeJob(
          greenhouseConnector.parseJob(await greenhouseConnector.fetchJob(refs[0], gc), gc), gc);
        ok('Greenhouse response still matches the expected shape', validateJobs([job]).length === 1);
        console.log(`        e.g. "${job.title}" at ${job.companyName}`);
      }
    } catch (error) {
      failed++; console.log(`  FAIL  Greenhouse: ${(error as Error).message}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  stageOffline();
  if (args.includes('--db') || args.includes('--all')) await stageDb();
  if (args.includes('--live') || args.includes('--all')) await stageLive();

  console.log(`\n${'-'.repeat(52)}`);
  console.log(`${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => { console.error(error); process.exit(1); });
