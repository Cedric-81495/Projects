import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Thin progress bar across the top on route change.
 *
 * Lazily-loaded routes take a moment to fetch their chunk, and without any
 * feedback that reads as an unresponsive click. The bar is indeterminate by
 * design — the real duration is unknown, and a fake percentage would be a lie.
 */
export function PageTransitionBar() {
  const { pathname } = useLocation()
  const [active, setActive] = useState(false)

  useEffect(() => {
    setActive(true)
    const timer = window.setTimeout(() => setActive(false), 520)
    return () => window.clearTimeout(timer)
  }, [pathname])

  if (!active) return null

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-transparent"
      // Purely decorative feedback; the route content itself is what matters.
      aria-hidden="true"
    >
      <div className="h-full w-full origin-left animate-indeterminate-bar bg-accent" />
    </div>
  )
}
