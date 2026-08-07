import bcrypt from 'bcryptjs';

/**
 * Password hashing.
 *
 * bcrypt at cost 12 — roughly 250ms per hash on typical hardware, which is the
 * point: it makes offline cracking expensive. bcryptjs is pure JavaScript, so
 * it needs no native build step on Render.
 *
 * Argon2id is the stronger modern choice and worth revisiting if the project
 * takes on a native build step.
 */
const COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Burns a comparable amount of time when no user exists.
 *
 * Without this, "unknown email" returns in ~1ms while "wrong password" takes
 * ~250ms, and that difference alone tells an attacker which addresses are
 * registered.
 */
export async function fakeVerify(): Promise<void> {
  await bcrypt.compare('placeholder', '$2a$12$abcdefghijklmnopqrstuu1234567890abcdefghijklmnopqrs');
}
