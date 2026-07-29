import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn'

/**
 * Floating scroll-to-top control, revealed once the page is scrolled far enough
 * that returning by hand would be tedious.
 */
export function BackToTop({ threshold = 400 }: { threshold?: number }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    /**
     * The scroll handler is throttled to one call per frame with
     * requestAnimationFrame. A bare listener fires far more often than the
     * screen refreshes and would burn main-thread time on every wheel event.
     */
    let frame = 0

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        setVisible(window.scrollY > threshold)
        frame = 0
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [threshold])

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={cn(
        'fixed bottom-6 right-5 z-40 grid h-11 w-11 place-items-center rounded-full',
        'border border-line bg-surface/90 text-ink shadow-lifted backdrop-blur',
        'transition-all duration-300 ease-entrance hover:-translate-y-0.5 hover:bg-surface',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      )}
      // Removed from the tab order while hidden, so keyboard users do not land
      // on an invisible control.
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      aria-label="Back to top"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 19V5M12 5l-6 6M12 5l6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
