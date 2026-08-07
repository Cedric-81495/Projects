/**
 * Smoke test.
 *
 * Verifies everything that does not need a live database: the response
 * envelope, validation, authentication, authorisation, CORS, rate-limit
 * headers, and the error handler.
 *
 * Mongo-backed behaviour (engagement deduplication, refresh rotation, consent
 * gating) needs a real connection and is covered by scripts/verify-db.ts.
 *
 *   npx tsx scripts/smoke.ts
 */

process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/h2c-smoke';
process.env.JWT_ACCESS_SECRET ??= 'smoke-access-secret-that-is-long-enough-000';
process.env.JWT_REFRESH_SECRET ??= 'smoke-refresh-secret-that-is-long-enough-1';
process.env.NODE_ENV = 'test';
process.env.CORS_ORIGINS = 'http://localhost:5173';
process.env.LOG_LEVEL = 'silent';

import type { Server } from 'node:http';

/**
 * Imported dynamically, after the environment above is set. ESM hoists static
 * imports above every statement in the file, so a top-level `import` of the
 * app would load src/config/env before these assignments ran and exit.
 */
const { createApp } = await import('../src/app');
const mongoose = (await import('mongoose')).default;

// Fail fast instead of buffering for 10s when there is no connection.
mongoose.set('bufferCommands', false);

const PORT = 5099;
const BASE = `http://127.0.0.1:${PORT}/api/v1`;

interface Body {
  success?: boolean;
  data?: Record<string, unknown>;
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

async function json(res: Response): Promise<Body> {
  return (await res.json().catch(() => ({}))) as Body;
}

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: unknown): void {
  if (condition) {
    passed += 1;
    console.log(`  ok    ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
    if (detail !== undefined) console.log(`        ${JSON.stringify(detail).slice(0, 220)}`);
  }
}

async function main(): Promise<void> {
  const app = createApp();
  const server: Server = await new Promise((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });

  console.log('\nHandcuffs 2 Cufflinks API — smoke test\n');

  /* ---------------------------------------------------------------- */
  console.log('Envelope and routing');

  const root = await fetch(`${BASE}/`);
  const rootBody = await json(root);
  check('GET / returns 200', root.status === 200, root.status);
  check('response uses the { success, data } envelope',
    rootBody.success === true && typeof rootBody.data === 'object', rootBody);

  const missing = await fetch(`${BASE}/definitely-not-a-route`);
  const missingBody = await json(missing);
  check('unknown route returns 404', missing.status === 404, missing.status);
  check('error uses the { success:false, message } envelope',
    missingBody.success === false && typeof missingBody.message === 'string', missingBody);
  check('error carries a machine-readable code', missingBody.code === 'NOT_FOUND', missingBody);

  /* ---------------------------------------------------------------- */
  console.log('\nHealth');

  const health = await fetch(`${BASE}/health`);
  const healthBody = await json(health);
  check('reports 503 when the database is unreachable', health.status === 503, health.status);
  check('names the database state', healthBody.data?.database === 'disconnected', healthBody);

  /* ---------------------------------------------------------------- */
  console.log('\nValidation');

  const badSignIn = await fetch(`${BASE}/auth/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'not-an-email', password: '' }),
  });
  const badBody = await json(badSignIn);
  check('rejects an invalid body with 400', badSignIn.status === 400, badSignIn.status);
  check('returns per-field errors', typeof badBody.errors?.email?.[0] === 'string', badBody);
  check('messages say what to do',
    /valid email/i.test(badBody.errors?.email?.[0] ?? ''), badBody.errors);

  const badSubscribe = await fetch(`${BASE}/subscribers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName: 'A', email: 'a@b.co', consentEmail: false }),
  });
  const subBody = await json(badSubscribe);
  check('subscribe requires explicit email consent', badSubscribe.status === 400, badSubscribe.status);
  check('consent message is human', /tick the box/i.test(JSON.stringify(subBody.errors ?? {})), subBody);

  /* ---------------------------------------------------------------- */
  console.log('\nAuthentication and authorisation');

  for (const path of ['/users', '/analytics/dashboard', '/subscribers', '/users/audit-log']) {
    const res = await fetch(`${BASE}${path}`);
    check(`${path} requires authentication`, res.status === 401, res.status);
  }

  const badToken = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: 'Bearer not.a.real.token' },
  });
  check('a forged token is rejected', badToken.status === 401, badToken.status);

  const noSession = await fetch(`${BASE}/auth/refresh`, { method: 'POST' });
  check('refresh without a cookie returns 401', noSession.status === 401, noSession.status);

  const adminList = await fetch(`${BASE}/collections/admin/all`);
  check('admin content listing is protected', adminList.status === 401, adminList.status);

  /* ---------------------------------------------------------------- */
  console.log('\nPublic reads are open');

  const publicList = await fetch(`${BASE}/collections`);
  // 500 because there is no database here; the point is that it was not a 401.
  check('public collection listing does not require auth', publicList.status !== 401, publicList.status);

  /* ---------------------------------------------------------------- */
  console.log('\nCORS');

  const allowed = await fetch(`${BASE}/`, { headers: { Origin: 'http://localhost:5173' } });
  check('allowlisted origin is permitted',
    allowed.headers.get('access-control-allow-origin') === 'http://localhost:5173',
    allowed.headers.get('access-control-allow-origin'));
  check('credentials are allowed for it',
    allowed.headers.get('access-control-allow-credentials') === 'true');

  const blocked = await fetch(`${BASE}/`, { headers: { Origin: 'https://evil.example.com' } });
  check('unknown origin is blocked', blocked.status === 403, blocked.status);

  /* ---------------------------------------------------------------- */
  console.log('\nSecurity headers and limits');

  check('rate limit headers are present', allowed.headers.has('ratelimit'), [...allowed.headers.keys()]);
  check('x-powered-by is removed', !allowed.headers.has('x-powered-by'));
  check('nosniff is set', allowed.headers.get('x-content-type-options') === 'nosniff');

  const oversized = await fetch(`${BASE}/subscribers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName: 'x'.repeat(2_000_000), email: 'a@b.co', consentEmail: true }),
  });
  check('oversized body returns 413, not 500', oversized.status === 413, oversized.status);

  const malformed = await fetch(`${BASE}/subscribers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"firstName": broken',
  });
  check('malformed JSON returns 400, not 500', malformed.status === 400, malformed.status);

  /* ---------------------------------------------------------------- */
  console.log('\nInternal errors are not leaked');

  const dbBacked = await fetch(`${BASE}/collections`);
  const dbBody = await json(dbBacked);
  const serialised = JSON.stringify(dbBody);
  check('no stack traces in the response', !/at\s+\w+\s+\(/.test(serialised), serialised.slice(0, 160));
  check('no mongo internals in the response',
    !/mongo|buffering|topology/i.test(dbBody.message ?? ''), dbBody.message);

  /* ---------------------------------------------------------------- */
  server.close();
  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error: unknown) => {
  console.error('\nSmoke test crashed:', error);
  process.exit(1);
});
