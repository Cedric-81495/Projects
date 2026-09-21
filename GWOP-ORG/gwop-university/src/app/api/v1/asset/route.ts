import 'server-only'
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { admin } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import { logger } from '@/lib/observability/logger'
import { LEVELS, canAccessLevel, type AccessState } from '@/lib/access/policy'
import { findAssetByKey } from '@/content/modules'

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
  const asset = findAssetByKey(key)
  if (!asset) return new NextResponse('Not found', { status: 404 })

  const supabase = await createServerSupabase()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return new NextResponse('Not found', { status: 404 })

  /* ⚠ enrolled_levels, not max_enrolled_level. This route signs download URLs
     for lesson worksheets, so it is an access decision, not a display value.
     Under per-level entitlement (0014) a student holding Level 3 has no claim
     on the Level 1 workbook — and with the old `>= level` check they could
     have downloaded it. */
  const { data: levels } = await supabase.rpc('enrolled_levels', {
    uid: userData.user.id,
  })
  const { data: enrolled } = await supabase.rpc('max_enrolled_level', {
    uid: userData.user.id,
  })

  /* ⚠ ANY of the asset's levels, not the first. Three paid PDFs ship in more
     than one level (master doc, shared asset map). Gating on the originating
     level would lock a Level 2 student out of Master the Money, which Level 2
     is sold as including. 99 is the unreachable sentinel for an unknown slug. */
  const levelNumbers = asset.levels.map(
    slug => LEVELS.find(l => l.slug === slug)?.level ?? 99,
  )
  /* ⚠ 'student' HERE IS DELIBERATE, UNLIKE THE PORTAL PAGES — reviewed
     2026-09-21, when three other call sites were corrected to fetch the real
     role. This one stays.

     A portal page decides what to DRAW. This route mints a signed URL to a
     paid PDF — a file that leaves the platform, can be forwarded, and cannot
     be recalled. Staff access exists for content review, and review happens
     against the source documents, not by pulling customer download links.

     Giving every staff account a working download endpoint for all twelve
     paid PDFs widens the blast radius of one compromised or departed staff
     login from "can read lessons in the browser" to "can take the product".
     The asymmetry is the point: read access in the UI, no bulk export.

     ⚠ IF A REVIEWER GENUINELY NEEDS THE FILES, grant them an enrollment or
     hand them the source. Do not widen this line — the moment it reads the
     real role, every staff session is a download key. */
  const access: AccessState = {
    userId: userData.user.id,
    role: 'student',
    enrolledLevel: typeof enrolled === 'number' ? enrolled : 0,
    enrolledLevels: Array.isArray(levels) ? (levels as number[]) : [],
  }

  /* `free` is belt and braces. A free asset should never carry a private bucket
     key in the first place — it takes a public path with a leading slash and
     never reaches this route — but if one ever does, it stays reachable rather
     than locking content we have said is open. */
  if (!asset.free && !levelNumbers.some(n => canAccessLevel(access, n))) {
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