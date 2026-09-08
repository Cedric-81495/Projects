/**
 * BLUEPRINT TEASER VIDEO.
 *
 * Felicia's 3:01am flow: sign up → Blueprint teaser → IdentityIQ → next step.
 * The teaser sits between the roadmap and the IdentityIQ card.
 *
 * ── NOTHING SHIPS UNTIL THERE IS A FILE ──────────────────────────────────────
 * `pending` stays true until an actual video URL is in `src`. While it is true,
 * attendees see nothing at all — no empty box, no broken player, no "video
 * coming soon". Only development shows the placeholder, so the layout can be
 * reviewed without anyone at a booth meeting a hole in the page.
 *
 * This is the same gate the consent wording and the Blueprint copy use.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const teaser = {
  /* ✅ LIVE — file supplied 2026-08-27. 720×1280 portrait, 29 seconds, under
     1 MB after compression. */
  /* ⚠ NO LONGER READ — 2026-09-08. Kept only so an older deploy of
     Assessment.tsx does not fail on a missing key.

     It used to gate the whole section: `!teaser.pending && teaser.src`. But
     `src` already answers "is there a file", so this was a second switch that
     could hide the teaser by itself. Setting it true now does nothing.

     To hide the teaser deliberately, empty `src`. One switch, and it is the
     one that describes the actual condition. */
  pending: false,

  /* Two shapes are supported, decided by the extension:
       · ends in .mp4  → rendered with a native <video> element
       · anything else → rendered as an <iframe> embed (Bunny Stream etc.)

     ⚠ AN IFRAME NEEDS A CSP CHANGE. `frame-src` in next.config.ts currently
     allows GoHighLevel and Turnstile only, so a Bunny embed would be blocked
     silently — the player simply never appears and the console explains why to
     nobody. An .mp4 served from our own domain needs no change at all, which is
     the reason to prefer it for a single short clip. */
  src: '/blueprint-teaser.mp4',

  /* First frame shown before playback. Without one, mobile Safari shows a black
     rectangle, which looks broken rather than pending. */
  /* ⚠ WAS '/teaser-poster.jpg'. THE FILE ON DISK IS teaser-poster.PNG, so this
     404'd and the poster never showed — <video poster> fails silently, leaving
     a black frame until playback starts. That reads as broken on a phone.

     ⚠ AND IT IS 9.6 MB, which is why it is now empty rather than corrected.
     A 9.6 MB poster on cellular costs more than the 1.1 MB video it is meant
     to preview, and `preload="none"` means the poster is the ONLY thing that
     downloads before a tap. Pointing this at the PNG would have replaced a
     silent 404 with a much more expensive bug.

     Empty is safe: the frame falls back to --forest-dk, which is a deliberate
     dark panel rather than a broken rectangle.

     TO FIX PROPERLY: export a poster from the first frame at the frame's real
     size — 9/16, roughly 640×1138 — as WebP, target under 80 KB, save as
     /teaser-poster.webp and put that path here. */
  poster: '',

  /* ✅ Felicia, 2026-08-27, verbatim. Replaced my placeholder "Watch this
     first". Sits between the roadmap someone has just been given and the
     booking CTA — do not reword. */
  heading: 'Your Blueprint Is Just the Beginning.',
  /* ⚠ WAS EMPTY, SO NOTHING RENDERED HERE. The component only prints the
     caption when it is truthy — `{teaser.caption && …}` — which meant this
     line from the approved design never appeared on the page at all. That is
     why the section read as "left out".

     It is also the line that does the most work in this block: it makes the
     video optional rather than a step somebody owes, right after they have
     been handed a plan. Do not empty it again. */
  caption: "Watch it when you're ready — your moves above don't change either way.",
} as const
