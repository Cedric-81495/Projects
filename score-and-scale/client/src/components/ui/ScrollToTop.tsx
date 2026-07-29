import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Restores scroll position on navigation.
 *
 * A single-page app keeps the scroll offset across route changes, so without
 * this a visitor who scrolls to the footer and clicks a link lands halfway down
 * the next page. When the destination carries a hash the target element is
 * scrolled into view instead — which is what makes cross-route section links
 * from SectionLink work.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      /**
       * Deferred by a frame: the destination route has not painted yet when
       * this effect runs, so the element would not be found on the first try.
       */
      const id = hash.slice(1)
      const frame = requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      return () => cancelAnimationFrame(frame)
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
    return undefined
  }, [pathname, hash])

  return null
}
