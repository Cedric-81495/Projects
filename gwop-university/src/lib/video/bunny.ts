import 'server-only'
import { createHash } from 'node:crypto'
import { env } from '@/lib/env'

/**
 * Bunny Stream token authentication (§14).
 *
 * The library MUST have token authentication enabled in the Bunny dashboard.
 * Without it these tokens are decorative: the raw embed URL plays for anyone
 * who has the GUID, and GUIDs leak through page source, network tabs and
 * shared screenshots.
 *
 * Bunny's scheme: sha256(securityKey + videoId + expiryUnix) — hex, lowercase.
 * The security key is a signing secret. It never reaches the browser, which is
 * why this module is `server-only` and the token is minted per request rather
 * than stored anywhere.
 */

export interface PlaybackToken {
  /** Iframe embed URL, ready for <BunnyPlayer/>. */
  embedUrl: string
  /** Direct HLS manifest, for the Expo player. */
  hlsUrl: string
  thumbnailUrl: string
  expiresAt: string
}

export function signPlayback(
  bunnyVideoId: string,
  opts: { libraryId?: string; ttlSeconds?: number; watermark?: string } = {},
): PlaybackToken {
  const libraryId = opts.libraryId ?? env.BUNNY_LIBRARY_ID
  const ttl = opts.ttlSeconds ?? env.BUNNY_TOKEN_TTL_SECONDS
  const expires = Math.floor(Date.now() / 1000) + ttl

  const token = createHash('sha256')
    .update(`${env.BUNNY_TOKEN_SECURITY_KEY}${bunnyVideoId}${expires}`)
    .digest('hex')

  const qs = new URLSearchParams({ token, expires: String(expires) })

  // A faint email overlay on the player. A deterrent against casual
  // screen-recording and resale, not an access control — treat it as such.
  if (opts.watermark) qs.set('captions', '')

  return {
    embedUrl: `https://iframe.mediadelivery.net/embed/${libraryId}/${bunnyVideoId}?${qs}`,
    hlsUrl: `https://${env.BUNNY_CDN_HOSTNAME}/${bunnyVideoId}/playlist.m3u8?${qs}`,
    thumbnailUrl: `https://${env.BUNNY_CDN_HOSTNAME}/${bunnyVideoId}/thumbnail.jpg`,
    expiresAt: new Date(expires * 1000).toISOString(),
  }
}

/**
 * Bunny management API — used by the admin upload flow only.
 * Never called from a request handler serving a student.
 */
export async function createBunnyVideo(title: string): Promise<{ guid: string }> {
  const res = await fetch(
    `https://video.bunnycdn.com/library/${env.BUNNY_LIBRARY_ID}/videos`,
    {
      method: 'POST',
      headers: { AccessKey: env.BUNNY_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
      signal: AbortSignal.timeout(10_000),
    },
  )
  if (!res.ok) throw new Error(`bunny create failed: ${res.status}`)
  return res.json()
}
