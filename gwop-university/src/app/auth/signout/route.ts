import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * POST only. A GET sign-out is CSRF-able and gets triggered by link
 * prefetchers and antivirus scanners, which logs people out at random.
 */
export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut({ scope: 'global' })
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 })
}
