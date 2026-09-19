import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireServiceRole, serverEnv } from '@/lib/env';

/** Read-only client, safe for anything the browser or a page render touches. */
export function publicClient(): SupabaseClient {
  const env = serverEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

/** Write client. Bypasses RLS — only ever used in server code. */
export function serviceClient(): SupabaseClient {
  const env = serverEnv();
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, requireServiceRole(), {
    auth: { persistSession: false },
  });
}
