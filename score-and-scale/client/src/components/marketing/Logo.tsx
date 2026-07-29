/**
 * Wordmark with an inline mark.
 *
 * Inline SVG rather than an image file: it inherits the theme's ink colour, has
 * no network cost, and stays crisp at any size.
 */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className="grid h-8 w-8 place-items-center rounded-[0.55rem] bg-ink text-canvas"
        aria-hidden="true"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          {/* Rising bars — the "scale" half of the name. */}
          <path
            d="M5 17.5v-4M12 17.5V9M19 17.5V5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {!compact && (
        <span className="text-[0.9375rem] font-semibold tracking-[-0.02em] text-ink">
          Score<span className="text-accent">&amp;</span>Scale
        </span>
      )}
    </span>
  )
}
