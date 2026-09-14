import type { ModuleStatus } from '@/content/modules'

/* ═══════════════════════════════════════════════════════════════════════════
   LESSON PLAYER — THREE STATES, ONE OF WHICH IS "NOT YET"

   Replaces the hardcoded line that used to sit in
   /app/[level]/[module]/page.tsx:

     <div className="player">
       Video loads here — awaiting Maui &amp; Sheena's upload
     </div>

   That rendered identically whether the file was uploaded, in production, or
   had never been started — and it named two colleagues to a paying student,
   which is an internal detail in a place customers read.

   ── THE SHAPE IS THE PLAYBACK TICKET'S ON PURPOSE ─────────────────────────
   `status` and the optional `url` mirror PlaybackTicket from
   lib/services/playback.ts. Today the page passes the static status from
   content/modules.ts, because nothing fetches the endpoint yet. When the
   player is wired to /api/v1/lessons/[id]/playback, the ticket can be spread
   into these props without the component changing:

     <LessonPlayer {...ticket} title={lesson.title} />

   That is the whole reason this takes `status` rather than `video?: string`.
   A component that branches on "is there a URL" cannot tell an unfilmed
   lesson from a failed fetch, and those need different words.

   ── WHY 'missing' AND 'pending' READ DIFFERENTLY ──────────────────────────
   content/modules.ts already distinguishes them and STATUS_LABEL calls them
   "In production" and "Missing assets". That distinction is for /admin, where
   Maui needs to see the gap. A student should not be told which internal
   bucket their lesson is in — both say the same thing to them, and the
   difference only survives in the data attribute for support and for CSS.

   ⚠ NO DATES. Not "coming soon in October", not "next week". Build order item
   9 is "resolve the video runtime problem, then film" — nobody has a date, and
   a promised one on a page beside a no-refund policy is a refund argument.
   ═══════════════════════════════════════════════════════════════════════════ */

export type LessonPlayerProps = {
  /** 'ready' shows the asset. Anything else shows the waiting state. */
  status: ModuleStatus
  /** Present only when status is 'ready'. Never construct one from the slug. */
  url?: string
  /** Used for the iframe's accessible name. */
  title: string
  /** Bunny embeds are iframes; a signed document link is not. */
  kind?: 'video' | 'pdf' | 'worksheet' | 'link' | 'quiz'
}

export function LessonPlayer({ status, url, title, kind = 'video' }: LessonPlayerProps) {
  /* Ready but no URL is a bug, not a state. Falling through to the waiting
     copy is the safe failure: the student sees "not available yet" rather than
     an empty black box, and the mismatch is already logged server-side by
     playback.ts as playback_provider_mismatch. */
  const ready = status === 'ready' && Boolean(url)

  if (ready && kind === 'video') {
    return (
      <div className="player player-live">
        <iframe
          src={url}
          title={title}
          loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    )
  }

  if (ready) {
    /* A document lesson. The link is already signed and short-lived — see
       playback.ts — so it is safe to render, and it must not be prefetched or
       followed by a crawler. */
    return (
      <div className="player">
        <a className="btn btn-o btn-sm" href={url} target="_blank" rel="noopener noreferrer">
          Open this lesson
        </a>
      </div>
    )
  }

  return (
    <div className="player player-waiting" data-status={status}>
      <div>
        <p className="player-eyebrow">Not available yet</p>
        <p className="player-note">
          This lesson is still being produced. It will appear here automatically
          when it is ready — nothing for you to do, and your access already
          covers it.
        </p>
      </div>
    </div>
  )
}
