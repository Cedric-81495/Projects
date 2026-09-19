import { NextResponse } from 'next/server';
import { z } from 'zod';
import { issueSession, passwordMatches } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

const schema = z.object({ password: z.string().min(1).max(500) });

/**
 * Attempts are throttled per process. Not a substitute for a real rate
 * limiter behind a load balancer, but enough to make guessing a long random
 * password pointless on a single instance.
 */
const attempts = new Map<string, { count: number; firstAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function throttled(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(request: Request) {
  const key = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'local';

  if (throttled(key)) {
    return NextResponse.json(
      { error: 'Too many attempts. Wait 15 minutes and try again.' },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'A password is required.' }, { status: 400 });
  }

  let ok = false;
  try {
    ok = passwordMatches(parsed.data.password);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 503 });
  }

  if (!ok) {
    // Deliberately vague: never confirm whether a password exists or is close.
    return NextResponse.json({ error: 'That password was not accepted.' }, { status: 401 });
  }

  attempts.delete(key);

  const session = issueSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: session.name,
    value: session.value,
    httpOnly: true,                 // unreadable from JavaScript
    sameSite: 'strict',             // not sent on cross-site requests
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: session.maxAge,
  });
  return response;
}
