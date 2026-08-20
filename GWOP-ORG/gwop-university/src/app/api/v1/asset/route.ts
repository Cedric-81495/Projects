import 'server-only'
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { admin } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import { logger } from '@/lib/observability/logger'
import { LEVELS, canAccessLevel, type AccessState } from '@/lib/access/policy'
import { MODULES } from '@/content/modules'

export const dynamic = 'force-dynamic'

/**
 * PAID COURSE ASSETS — entitlement check, then a link that expires.
 *
 * Free assets keep their public/ path and never reach this route; they are
 * meant to be shareable. Anything paid lives as a key in the private Supabase
 * bucket and is only reachable here.
 *
 * The response is a redirect to a signed Supabase URL valid for
 * SIGNED_URL_TTL_SECONDS (15 minutes by default). Copy that URL into a group
 * chat and it is dead before anyone opens it — which is the actual failure mode
 * worth defending against, since a URL cannot be un-shared once it is out.
 *
 * Redirect rather than streaming the bytes through here: the file then comes
 * from Supabase's CDN instead of a serverless function, so a 3MB PDF on venue
 * cellular does not run up function time or risk a timeout. Same reasoning as
 * playback.ts, which does this for lesson video.
 *
 * 404 rather than 403 throughout, matching playback.ts. A 403 confirms that
 * something exists at that key, which makes the catalogue enumerable by anyone
 * willing to run a script.
 */
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get('key')?.trim()
  if (!key) return new NextResponse('Not found', { status: 404 })

  /* A leading slash means a public/ path — those are free assets and are served
     by the CDN directly. Refusing them here keeps the two kinds from blurring:
     this route only ever deals in private bucket keys. */
  if (key.startsWith('/') || key.startsWith('http')) {
    return new NextResponse('Not found', { status: 404 })
  }

  /* The key must appear in the content file. This is the authorization lookup
     AND the traversal guard — no arrangement of `../` matches an entry in
     MODULES, so nothing unvalidated reaches storage. */
  const mod = MODULES.find(m => m.note === key || m.workbook === key)
  if (!mod) return new NextResponse('Not found', { status: 404 })

  const supabase = await createServerSupabase()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return new NextResponse('Not found', { status: 404 })

  const { data: enrolled } = await supabase.rpc('max_enrolled_level', {
    uid: userData.user.id,
  })

  const levelNumber = LEVELS.find(l => l.slug === mod.level)?.level ?? 99
  const access: AccessState = {
    userId: userData.user.id,
    role: 'student',
    enrolledLevel: typeof enrolled === 'number' ? enrolled : 0,
  }

  /* `free` is belt and braces. A free module should never carry a bucket key in
     the first place, but if one ever does, it stays reachable rather than
     locking content the client has said is open. */
  if (!mod.free && !canAccessLevel(access, levelNumber)) {
    return new NextResponse('Not found', { status: 404 })
  }

  /* The admin client signs the URL — that is the one operation needing a role
     that bypasses RLS, and it happens only after the check above has passed. */
  const { data, error } = await admin.storage
    .from(env.MODULE_BUCKET)
    .createSignedUrl(key, env.SIGNED_URL_TTL_SECONDS, { download: false })

  if (error || !data?.signedUrl) {
    /* Logged, not surfaced. A missing file is our problem to fix; telling the
       student which key failed just leaks the storage layout. */
    logger.error('asset_sign_failed', { key, message: error?.message })
    return new NextResponse('Not found', { status: 404 })
  }

  return NextResponse.redirect(data.signedUrl, {
    /* 307 keeps the method and, unlike 301/302, is never cached by default —
       a cached redirect would outlive the signature it points at. */
    status: 307,
    headers: { 'cache-control': 'private, no-store' },
  })
}
