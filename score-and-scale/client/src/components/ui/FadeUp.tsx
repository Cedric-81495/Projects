import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface FadeUpProps {
  children: ReactNode
  /** Stagger in milliseconds, for revealing a row of cards in sequence. */
  delay?: number
  className?: string
}

/**
 * Reveals content on first scroll into view.
 *
 * IntersectionObserver rather than a scroll listener, so there is no work on
 * the main thread between reveals. The observer disconnects after firing —
 * these animations are one-shot, and a lingering observer per element would
 * accumulate across a long page.
 */
export function FadeUp({ children, delay = 0, className }: FadeUpProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    /**
     * Users who asked for reduced motion get the content immediately. Without
     * this branch they would be left staring at opacity-0 content, since the
     * global CSS override collapses the animation duration to nothing.
     */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      // Fire slightly before the element reaches the viewport edge so the
      // animation is already running by the time it is properly visible.
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(visible ? 'animate-fade-up' : 'opacity-0', className)}
      style={visible && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
