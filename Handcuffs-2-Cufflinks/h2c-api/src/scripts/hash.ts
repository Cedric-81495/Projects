/**
 * Generate a bcrypt hash for the admin password.
 * Usage:  npm run hash -- "your-strong-password"
 * Paste the output into ADMIN_PASSWORD_HASH.
 */
import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run hash -- "your-password"');
  process.exit(1);
}
const hash = bcrypt.hashSync(password, 12);
console.log(hash);
