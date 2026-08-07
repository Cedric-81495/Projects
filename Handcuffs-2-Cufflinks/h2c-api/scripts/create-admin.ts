/**
 * Creates the first Super Administrator.
 *
 * Run once after connecting a fresh database:
 *   npm run create-admin -- --email you@example.com --name "Your Name"
 *
 * The password is generated and printed once. It is never written to a file or
 * logged by the server, and the account is created with emailVerified false so
 * the real verification flow still applies.
 */
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { connectForScript } from '../src/db/connect';
import { hashPassword } from '../src/lib/password';
import { User } from '../src/models/User';

function arg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index > -1 ? process.argv[index + 1] : undefined;
}

/** Readable but high-entropy: 4 groups of 5 base32 chars ≈ 100 bits. */
function generatePassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(20);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]);
  return [0, 5, 10, 15].map((i) => chars.slice(i, i + 5).join('')).join('-');
}

async function main(): Promise<void> {
  const email = arg('--email')?.toLowerCase();
  const name = arg('--name');

  if (!email || !name) {
    console.error('\nUsage: npm run create-admin -- --email you@example.com --name "Your Name"\n');
    process.exit(1);
  }

  /**
   * Checked before connecting. A typo here creates an administrator whose
   * address cannot receive a password reset or verification mail — and it is
   * the one account that has to work.
   */
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(`\n"${email}" is not a valid email address. It needs an @ and a domain.\n`);
    process.exit(1);
  }

  await connectForScript();

  if (await User.exists({ email })) {
    console.error(`\nAn account already uses ${email}.\n`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const password = generatePassword();
  await User.create({
    fullName: name,
    email,
    passwordHash: await hashPassword(password),
    role: 'super-admin',
    emailVerified: false,
    isActive: true,
  });

  console.log(`
Super Administrator created.

  Email:    ${email}
  Password: ${password}

This password is shown once. Store it in a password manager now, and change it
after your first sign-in.
`);

  await mongoose.disconnect();
}

main().catch((error: unknown) => {
  console.error('\nFailed to create the administrator:', error);
  process.exit(1);
});
