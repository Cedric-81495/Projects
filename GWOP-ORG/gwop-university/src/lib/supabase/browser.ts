'use client'
import { createBrowserClient } from '@supabase/ssr'
import { publicEnv } from '@/lib/env'
import { authCookieOptions } from './cookies'
import type { Database } from './types'

export const createBrowserSupabase = () =>
  createBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    /* Must match the server clients exactly — see cookies.ts. A browser client
       writing host-only cookies while the server writes domain-scoped ones
       leaves two cookies of the same name in the jar. */
    { cookieOptions: authCookieOptions },
  )
