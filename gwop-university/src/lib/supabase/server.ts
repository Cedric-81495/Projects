import 'server-only'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { env } from '@/lib/env'
import type { Database } from './types'

/**
 * RLS-respecting client bound to the caller's session.
 *
 * Use this for EVERYTHING that reads or writes on behalf of a user. If a query
 * returns nothing, that is the policy doing its job — do not "fix" it by
 * reaching for the admin client.
 */
export async function createServerSupabase() {
  // Next 15: cookies() is async. Awaiting it here is why every caller must
  // `await createServerSupabase()` — including inside Server Components.
  const cookieStore = await cookies()

  return createServerClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Middleware refreshes the session, so this is safe to swallow.
        }
      },
    },
  })
}

/**
 * Same, but for a Bearer token — this is how the mobile app authenticates.
 * One codepath, one set of policies, two clients.
 */
export function createBearerSupabase(accessToken: string) {
  return createServerClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: { getAll: () => [], setAll: () => {} },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}
