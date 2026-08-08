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
  /** Where members land after Google sign-in. Separate from the CMS redirect. */
  OAUTH_MEMBER_REDIRECT: z.string().url().default('http://localhost:5173/community'),
  /** Where either flow lands when Google sign-in is refused. */
  OAUTH_FAILURE_REDIRECT: z.string().url().default('http://localhost:5173/sign-in'),

  SITE_URL: z.string().url().default('http://localhost:5173'),
  /** Where the CMS lives. Password reset and verification links point here. */
  ADMIN_URL: z.string().url().default('http://localhost:5173/admin'),

  // --- Mail -----------------------------------------------------------------
  // Optional. Without a key the mailer logs messages in full rather than
  // sending them, so local development needs no vendor account.
  RESEND_API_KEY: z.string().optional(),
  MAIL_FROM: z.string().default('Handcuffs 2 Cufflinks <no-reply@handcuffs2cufflinks.com>'),

  // --- Multi-factor authentication ------------------------------------------
  /**
   * When on, a super administrator who has not finished TOTP enrolment is
   * refused at sign-in. Off by default: switching it on before the team has
   * authenticator apps set up would lock everyone out of the CMS at once, so it
   * is a deliberate decision rather than a default.
   */
  REQUIRE_SUPER_ADMIN_MFA: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  /**
   * Optional DNS override, e.g. "8.8.8.8,1.1.1.1".
   *
   * mongodb+srv:// requires an SRV record lookup, and some ISP routers,
   * corporate resolvers, and VPNs refuse SRV queries while handling ordinary
   * records fine — which surfaces as `querySrv ECONNREFUSED` and looks like an
   * Atlas problem when it is not. Setting this points Node's resolver at a
   * public one for the process only, without touching system settings.
   */
  DNS_SERVERS: z.string().optional(),

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
  dnsServers: raw.DNS_SERVERS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [],
} as const;

/**
 * Secrets must never be identical. If they were, a refresh token would be
 * accepted as an access token and every session would effectively never expire.
 */
if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
  console.error('\nJWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values.\n');
  process.exit(1);
}
