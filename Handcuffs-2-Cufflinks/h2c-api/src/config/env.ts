import 'dotenv/config';
import { z } from 'zod';

/**
 * Validate environment at startup so the process fails fast (and loudly)
 * instead of misbehaving later with an undefined connection string or secret.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // ── Admin auth ──
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  JWT_EXPIRES_IN: z.string().default('2h'),
  ADMIN_EMAIL: z.string().email('ADMIN_EMAIL must be a valid email'),
  // bcrypt hash of the admin password (generate with `npm run hash -- "yourpass"`).
  ADMIN_PASSWORD_HASH: z.string().min(20, 'ADMIN_PASSWORD_HASH is required'),
  // Send cookies only over HTTPS. Default true in prod.
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === undefined ? undefined : v === 'true'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  corsOrigins: raw.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean),
  cookieSecure: raw.COOKIE_SECURE ?? raw.NODE_ENV === 'production',
};
