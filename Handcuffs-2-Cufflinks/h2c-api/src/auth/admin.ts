import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

/**
 * Single-admin auth backed by env (ADMIN_EMAIL + ADMIN_PASSWORD_HASH).
 * Keeps secrets out of the database and works without seeding a user.
 * (To support multiple admins later, swap this for an Admin collection.)
 */
export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  const emailMatch = email.trim().toLowerCase() === env.ADMIN_EMAIL.toLowerCase();
  // Always run bcrypt.compare to keep timing consistent even on email mismatch.
  const hash = emailMatch ? env.ADMIN_PASSWORD_HASH : '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinv';
  const passwordMatch = await bcrypt.compare(password, hash);
  return emailMatch && passwordMatch;
}
