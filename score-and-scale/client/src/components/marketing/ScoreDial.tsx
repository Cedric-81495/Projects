import { useEffect, useRef, useState } from 'react'

interface ScoreDialProps {
  /** Target score on the standard 300–850 scale. */
  score?: number
  label?: string
  size?: number
}

const MIN_SCORE = 300
const MAX_SCORE = 850

/**
 * Animated credit-score dial — the hero's focal point.
 *
 * Drawn as a stroked SVG arc animated via stroke-dashoffset, which the compositor
 * can handle without layout work on each frame. The count-up is driven by
 * requestAnimationFrame with an eased curve so it decelerates into the final
 * number rather than stopping abruptly.
 */
export function ScoreDial({ score = 782, label = 'Average member score', size = 232 }: ScoreDialProps) {
  const [displayed, setDisplayed] = useState(MIN_SCORE)
  const containerRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    // Respect reduced motion by showing the final value immediately.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayed(score)
      return
    }

    const animate = () => {
      const duration = 1600
      const start = performance.now()

      const step = (now: number) => {
        const progress = Math.min((now - start) / duration, 1)
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplayed(Math.round(MIN_SCORE + (score - MIN_SCORE) * eased))
        if (progress < 1) requestAnimationFrame(step)
      }

      requestAnimationFrame(step)
    }

    /**
     * Only animate once the dial is actually on screen — starting on mount
     * would mean the count-up is already over for anyone who scrolls down.
     */
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !startedRef.current) {
          startedRef.current = true
          animate()
          observer.disconnect()
        }
      },
      { threshold: 0.4 },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [score])

  const stroke = 14
  const radius = (size - stroke) / 2
  const circumference = Math.PI * radius * 1.5 // 270° sweep
  const fraction = (displayed - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)

  return (
    <div ref={containerRef} className="relative inline-grid place-items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        // The value is announced through the visible text below, so the graphic
        // itself is decorative to assistive tech.
        aria-hidden="true"
        className="-rotate-[135deg]"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--color-line))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference * 2}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--color-accent))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference * 2}`}
          strokeDashoffset={circumference * (1 - fraction)}
        />
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p
            className="text-[2.75rem] font-semibold leading-none tracking-[-0.03em] tabular-nums"
            // Announce the final figure once, not every intermediate frame.
            aria-live="off"
          >
            {displayed}
          </p>
          <p className="mt-2 max-w-[8rem] text-xs leading-snug text-muted">{label}</p>
        </div>
      </div>
    </div>
  )
}
