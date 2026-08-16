import 'server-only'
import { admin } from '@/lib/supabase/admin'
import { env } from '@/lib/env'
import { signPlayback } from '@/lib/video/bunny'
import { ApiError, notFound } from '@/lib/http/errors'
import type { AuthContext } from '@/lib/auth/context'
import { logger } from '@/lib/observability/logger'

/**
 * Issuing a playback ticket is the most sensitive operation in the platform:
 * it hands the client a bearer credential to the business's paid IP.
 *
 * THE ORDER BELOW IS NOT NEGOTIABLE.
 *   1. Read the lesson through the CALLER'S RLS-bound client, so Postgres
 *      decides enrollment.
 *   2. Only then sign — and sign only the identifier that the authorized read
 *      returned, never one taken from the request.
 *   3. Audit it.
 *
 * Inverting 1 and 2 — fetching with the service role "just to get the Bunny
 * GUID", then checking access — is precisely how paid course content leaks.
 * The service role sees every row.
 */

export interface PlaybackTicket {
  lessonId: string
  kind: 'video' | 'pdf' | 'worksheet' | 'link' | 'quiz'
  url: string
  hlsUrl?: string
  expiresAt: string
  /** Faint overlay in the player. A deterrent against resale, not a control. */
  watermark: string
}

export async function issuePlaybackTicket(
  ctx: AuthContext,
  lessonId: string,
  ip?: string,
): Promise<PlaybackTicket> {
  // 1. AUTHORIZATION. This query returns nothing unless an RLS policy permits it.
  const { data: lesson, error } = await ctx.db
    .from('lessons')
    .select('id, kind, level, published, storage_path, external_url, video:videos(bunny_video_id, bunny_library_id)')
    .eq('id', lessonId)
    .maybeSingle()

  if (error) {
    logger.error('playback_lookup_failed', { lessonId, message: error.message })
    throw new ApiError(503, 'upstream_unavailable', 'Could not load this lesson. Try again.')
  }

  // Deliberately 404, not 403. Confirming that a lesson exists at a given ID
  // makes the catalogue enumerable by anyone with a script.
  if (!lesson || !lesson.published) throw notFound('Lesson')

  // A nested select returns an array even for a to-one relation. Normalise it
  // once here rather than at each use site.
  const video = Array.isArray(lesson.video) ? lesson.video[0] : lesson.video

  let url: string
  let hlsUrl: string | undefined
  let expiresAt: string

  if (lesson.kind === 'link') {
    url = lesson.external_url!
    expiresAt = new Date(Date.now() + 60_000).toISOString()
  } else if (video) {
    // 2. Sign only what the authorized read returned.
    const token = signPlayback(video.bunny_video_id, {
      libraryId: video.bunny_library_id,
      watermark: ctx.email,
    })
    url = token.embedUrl
    hlsUrl = token.hlsUrl
    expiresAt = token.expiresAt
  } else {
    // PDFs and worksheets: PRIVATE Supabase Storage bucket, short-lived signed
    // URL. Never a public bucket path — those get scraped and shared.
    const ttl = env.SIGNED_URL_TTL_SECONDS
    const { data, error: signError } = await admin.storage
      .from(env.MODULE_BUCKET)
      .createSignedUrl(lesson.storage_path!, ttl, { download: false })

    if (signError || !data?.signedUrl) {
      logger.error('signed_url_failed', { lessonId, message: signError?.message })
      throw new ApiError(503, 'upstream_unavailable', 'Could not prepare this lesson. Try again.')
    }
    url = data.signedUrl
    expiresAt = new Date(Date.now() + ttl * 1000).toISOString()
  }

  // 3. Audit: who opened what, from where, and when.
  await admin.rpc('write_audit', {
    p_action: 'lesson.playback_issued',
    p_entity: 'lesson',
    p_entity_id: lessonId,
    p_metadata: { level: lesson.level, kind: lesson.kind, channel: ctx.channel },
    p_ip: ip ?? null,
    p_ua: null,
  })

  return { lessonId: lesson.id, kind: lesson.kind, url, hlsUrl, expiresAt, watermark: ctx.email }
}
