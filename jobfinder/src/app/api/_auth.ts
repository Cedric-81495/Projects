import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env';
import { requestHasSession } from '@/lib/admin-session';

/**
 * Constant-time comparison so a wrong token cannot be found by timing the
 * response.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function bearer(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Guards /api/admin/*. Two ways in: the signed session cookie the dashboard
 * gets after sign-in, or the raw token for scripts and curl. Returns a
 * response to send, or null when authorised.
 */
export function requireAdmin(request: Request): NextResponse | null {
  const expected = serverEnv().ADMIN_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: 'ADMIN_TOKEN is not configured on the server.' }, { status: 503 },
    );
  }

  if (requestHasSession(request)) return null;

  const supplied = request.headers.get('x-admin-token') ?? bearer(request);
  if (!supplied || !safeEqual(supplied, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

/**
 * Guards /api/cron/*. Vercel sends `Authorization: Bearer $CRON_SECRET` on
 * scheduled invocations; an external worker can send the same header.
 */
export function requireCron(request: Request): NextResponse | null {
  const expected = serverEnv().CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured on the server.' }, { status: 503 },
    );
  }
  const supplied = bearer(request) ?? request.headers.get('x-cron-secret');
  if (!supplied || !safeEqual(supplied, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
