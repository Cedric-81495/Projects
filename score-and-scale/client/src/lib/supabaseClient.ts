import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Browser Supabase client, used only to push file bytes to a signed upload URL.
 *
 * The anon key is safe to ship in the bundle — it is designed to be public and
 * is governed by Row Level Security. On its own it cannot write to the documents
 * bucket: every upload requires a short-lived token that only our API can mint,
 * and only after it has verified the enrollment belongs to the caller.
 */
let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (client) return client

  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Document uploads are not configured. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.',
    )
  }

  client = createClient(url, anonKey, {
    // This client carries no user session of its own; ours lives in httpOnly
    // cookies on the API domain.
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return client
}

export function getStorageBucket(): string {
  return import.meta.env.VITE_SUPABASE_STORAGE_BUCKET ?? 'enrollment-documents'
}
