import { z } from 'zod';

/**
 * Environment validation.
 *
 * Unlike the frontend — which must render even when misconfigured — the API
 * fails fast and loudly. A server that starts with a missing JWT secret or an
 * unset database URI is more dangerous than one that refuses to start, because
 * the failure surfaces later as a security hole rather than a boot error.
 */
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // 32 chars is the floor for a signing key with meaningful entropy.
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),

  CORS_ORIGINS: z.string().default('http://localhost:5173'),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),
  OAUTH_SUCCESS_REDIRECT: z.string().url().default('http://localhost:5173/admin/dashboard'),

  SITE_URL: z.string().url().default('http://localhost:5173'),

  VERCEL_DEPLOY_HOOK_URL: z.string().url().optional().or(z.literal('')),
  DEPLOY_HOOK_DEBOUNCE_MS: z.coerce.number().int().nonnegative().default(180_000),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  console.error(`\nInvalid environment configuration:\n${details}\n\nCopy .env.example to .env.\n`);
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isDevelopment: raw.NODE_ENV === 'development',
  corsOrigins: raw.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  googleOAuthEnabled: Boolean(raw.GOOGLE_CLIENT_ID && raw.GOOGLE_CLIENT_SECRET && raw.GOOGLE_CALLBACK_URL),
  deployHookUrl: raw.VERCEL_DEPLOY_HOOK_URL || undefined,
} as const;

/**
 * Secrets must never be identical. If they were, a refresh token would be
 * accepted as an access token and every session would effectively never expire.
 */
if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
  console.error('\nJWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values.\n');
  process.exit(1);
}
