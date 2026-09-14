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
  /**
   * 'ready'   — `url` is set and playable now.
   * 'pending' — the file has not been produced or uploaded yet. `url` is
   *             undefined. NOT an error: the lesson exists, the student is
   *             entitled to it, and it is not there yet. The caller must
   *             render that rather than retrying.
   */
  status: 'ready' | 'pending'
  /** Undefined when status is 'pending'. Never guess a URL from this. */
  url?: string
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
    .select('id, kind, level, published, asset_provider, storage_path, external_url, video:videos(bunny_video_id, bunny_library_id)')
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

  let url: string | undefined
  let hlsUrl: string | undefined
  let expiresAt: string
  let status: 'ready' | 'pending' = 'ready'

  /* ⚠ BRANCH ON THE RECORDED PROVIDER, NOT ON WHICH COLUMN HAPPENS TO BE SET.
     This used to read "if link … else if video … else sign a Supabase URL",
     which made Supabase the fallthrough. A lesson with no file at all took
     that branch and called createSignedUrl(null), and the student was told to
     try again about something that will not exist until somebody films it.

     `asset_provider` (0022) names the provider explicitly, and its check
     constraint guarantees the matching source column is populated — so each
     branch below can trust what it reads. 'pending' is a real answer, not the
     absence of one. */
  switch (lesson.asset_provider) {
    case 'pending': {
      /* The file has not been produced or uploaded yet. The student is
         entitled to this lesson; it is simply not there. Say so, and give the
         caller nothing that looks like a playable URL.

         Deliberately NOT an error. A 4xx or 5xx here would be logged, alerted
         on and retried, and none of that helps — the fix is filming, not a
         retry. `published` is false for these today (lessons_publishable
         refuses to publish an empty lesson), so in practice this branch is
         reached only by staff and admins reading ahead. */
      status = 'pending'
      expiresAt = new Date(Date.now() + 60_000).toISOString()
      break
    }

    case 'external': {
      url = lesson.external_url ?? undefined
      status = url ? 'ready' : 'pending'
      expiresAt = new Date(Date.now() + 60_000).toISOString()
      break
    }

    case 'bunny': {
      if (!video) {
        /* The constraint says this cannot happen. If it does, the video row was
           deleted out from under a lesson still claiming Bunny — which is a
           missing file, not a server fault. Degrade to pending rather than
           500, and leave a log line that names the cause. */
        logger.error('playback_provider_mismatch', {
          lessonId, provider: lesson.asset_provider,
        })
        status = 'pending'
        expiresAt = new Date(Date.now() + 60_000).toISOString()
        break
      }
      // Sign only what the authorized read returned.
      const token = signPlayback(video.bunny_video_id, {
        libraryId: video.bunny_library_id,
        watermark: ctx.email,
      })
      url = token.embedUrl
      hlsUrl = token.hlsUrl
      expiresAt = token.expiresAt
      break
    }

    case 'supabase':
    default: {
      /* PDFs and worksheets: PRIVATE Supabase Storage bucket, short-lived
         signed URL. Never a public bucket path — those get scraped and shared.

         `default` catches a provider added to the enum without a branch here.
         The guard below means an unhandled provider degrades to pending rather
         than signing a null key. */
      if (!lesson.storage_path) {
        logger.error('playback_provider_mismatch', {
          lessonId, provider: lesson.asset_provider,
        })
        status = 'pending'
        expiresAt = new Date(Date.now() + 60_000).toISOString()
        break
      }

      const ttl = env.SIGNED_URL_TTL_SECONDS
      const { data, error: signError } = await admin.storage
        .from(env.MODULE_BUCKET)
        .createSignedUrl(lesson.storage_path, ttl, { download: false })

      if (signError || !data?.signedUrl) {
        logger.error('signed_url_failed', { lessonId, message: signError?.message })
        throw new ApiError(503, 'upstream_unavailable', 'Could not prepare this lesson. Try again.')
      }
      url = data.signedUrl
      expiresAt = new Date(Date.now() + ttl * 1000).toISOString()
      break
    }
  }

  // 3. Audit: who opened what, from where, and when.
  await admin.rpc('write_audit', {
    p_action: 'lesson.playback_issued',
    p_entity: 'lesson',
    p_entity_id: lessonId,
    p_metadata: {
      level: lesson.level,
      kind: lesson.kind,
      channel: ctx.channel,
      /* Recorded so the audit distinguishes "opened a lesson" from "found an
         empty one". A run of these against the same lesson is a content gap
         students are hitting, not a security event. */
      provider: lesson.asset_provider,
      status,
    },
    p_ip: ip ?? null,
    p_ua: null,
  })

  return { lessonId: lesson.id, kind: lesson.kind, status, url, hlsUrl, expiresAt, watermark: ctx.email }
}
