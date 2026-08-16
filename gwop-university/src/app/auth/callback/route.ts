import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { safeNext } from '@/lib/auth/redirect'

/**
 * Exchanges the one-time code from a confirmation or password-reset email for
 * a session. This is the only route that turns an emailed link into cookies.
 *
 * `next` runs through safeNext() because it arrives from the URL — an unchecked
 * value here would let a phishing email produce a redirect from our own domain
 * after a successful login.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (!code) return NextResponse.redirect(`${origin}/login?error=link_invalid`)

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  // Generic reason. "Link expired" vs "link already used" tells an attacker
  // holding an intercepted link which state it is in.
  if (error) return NextResponse.redirect(`${origin}/login?error=link_invalid`)

  return NextResponse.redirect(`${origin}${next}`)
}
