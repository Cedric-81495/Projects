interface SpinnerProps {
  size?: number
  className?: string
  /** Screen-reader label. Omit when a visible label already describes the wait. */
  label?: string
}

/**
 * Inline loading indicator. Uses currentColor so it inherits whatever it is
 * placed inside — a dark button, a light card — with no variant prop.
 */
export function Spinner({ size = 16, className = '', label }: SpinnerProps) {
  return (
    <>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={`animate-spin ${className}`}
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {label && <span className="sr-only">{label}</span>}
    </>
  )
}

/** Centred block spinner for route-level and panel-level loading states. */
export function LoadingBlock({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-muted" role="status">
      <Spinner size={22} label={label} />
    </div>
  )
}
