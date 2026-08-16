import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { Database } from './types'

/**
 * ⚠ SERVICE ROLE — BYPASSES ROW LEVEL SECURITY ENTIRELY.
 *
 * Legitimate uses, and there are only four:
 *   1. The Stripe webhook (no user session exists).
 *   2. The lead capture endpoint (writes to a table with no client policies).
 *   3. Scheduled jobs (expiry sweep, GHL retry).
 *   4. Generating signed storage URLs — AFTER an explicit authorization check.
 *
 * Anywhere else, you want `createServerSupabase()`. Reaching for this client to
 * make a query "work" removes the only guarantee the mobile app has.
 *
 * The `import 'server-only'` above makes bundling this into client code a build
 * failure rather than a breach.
 */
export const admin = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { 'X-Client-Info': 'gwop-server' } },
})
