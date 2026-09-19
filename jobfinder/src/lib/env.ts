import { z } from 'zod';

/**
 * Fail fast and loudly when configuration is missing, instead of throwing
 * a confusing error deep inside a Supabase call.
 */
const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  ADMIN_TOKEN: z.string().min(16).optional(),
  ADMIN_PASSWORD: z.string().min(12).optional(),
  CRON_SECRET: z.string().min(16).optional(),
  CRAWLER_USER_AGENT: z.string().min(1).default('JobFinderBot/0.1'),
  GREENHOUSE_BOARDS: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(
      `Missing or invalid environment variables: ${missing}. Copy .env.example to .env.local and fill it in.`,
    );
  }
  cached = parsed.data;
  return cached;
}

export function requireServiceRole(): string {
  const key = serverEnv().SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for write operations.');
  return key;
}
