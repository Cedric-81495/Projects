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
  /* Flip to false once `src` points at a real file. */
  pending: true,

  /* Two shapes are supported, decided by the extension:
       · ends in .mp4  → rendered with a native <video> element
       · anything else → rendered as an <iframe> embed (Bunny Stream etc.)

     ⚠ AN IFRAME NEEDS A CSP CHANGE. `frame-src` in next.config.ts currently
     allows GoHighLevel and Turnstile only, so a Bunny embed would be blocked
     silently — the player simply never appears and the console explains why to
     nobody. An .mp4 served from our own domain needs no change at all, which is
     the reason to prefer it for a single short clip. */
  src: '',

  /* First frame shown before playback. Without one, mobile Safari shows a black
     rectangle, which looks broken rather than pending. */
  poster: '',

  heading: 'Watch this first',
  /* Optional. Kept short — this sits between the roadmap someone just earned
     and the next-step card, and anything long here delays both. */
  caption: '',
} as const
