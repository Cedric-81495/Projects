import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { serverEnv } from './env';

const COOKIE_NAME = 'jf_admin';
const TTL_SECONDS = 12 * 60 * 60;

/**
 * Sessions are a signed cookie, not a database row: there is exactly one
 * operator, so a stateless HMAC is the right amount of machinery. The cookie
 * holds an expiry and a signature over it, nothing else — it is not a
 * password store and cannot be turned back into one.
 */
function signingSecret(): string {
  const token = serverEnv().ADMIN_TOKEN;
  if (!token) {
    throw new Error('ADMIN_TOKEN must be set before the admin area can be used.');
  }
  return token;
}

function sign(payload: string): string {
  return createHmac('sha256', signingSecret()).update(payload).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function issueSession(): { name: string; value: string; maxAge: number } {
  const expiresAt = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const nonce = randomBytes(8).toString('hex');
  const payload = `${expiresAt}.${nonce}`;
  return { name: COOKIE_NAME, value: `${payload}.${sign(payload)}`, maxAge: TTL_SECONDS };
}

export function verifySession(value: string | undefined): boolean {
  if (!value) return false;
  const parts = value.split('.');
  if (parts.length !== 3) return false;
  const [expiresAt, nonce, signature] = parts;

  const expected = sign(`${expiresAt}.${nonce}`);
  if (!safeEqual(signature, expected)) return false;

  const expiry = Number(expiresAt);
  return Number.isFinite(expiry) && expiry * 1000 > Date.now();
}

/** For server components. Reads the cookie jar of the current request. */
export async function hasAdminSession(): Promise<boolean> {
  try {
    const store = await cookies();
    return verifySession(store.get(COOKIE_NAME)?.value);
  } catch {
    return false;
  }
}

/** For route handlers, which receive the request directly. */
export function requestHasSession(request: Request): boolean {
  const header = request.headers.get('cookie');
  if (!header) return false;
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE_NAME) return verifySession(rest.join('='));
  }
  return false;
}

/**
 * The password the operator types. Falls back to ADMIN_TOKEN so the admin area
 * is never left open just because ADMIN_PASSWORD was not set.
 */
export function passwordMatches(input: string): boolean {
  const env = serverEnv();
  const expected = env.ADMIN_PASSWORD || env.ADMIN_TOKEN;
  if (!expected || !input) return false;
  return safeEqual(input, expected);
}

export const ADMIN_COOKIE = COOKIE_NAME;
