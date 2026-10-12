import { useEffect, useRef, useState } from 'react'

/**
 * A horizontally auto-scrolling track. It starts moving once it scrolls
 * into view, pauses on hover/keyboard focus (so a visitor reading a card
 * doesn't have it slide away), and exposes a pause/resume button since
 * continuously-moving content needs to stay user-controllable.
 */
export function AutoCarousel({ items, renderItem, ariaLabel, speed = 36 }) {
  const wrapperRef = useRef(null)
  const [inView, setInView] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (e) => setReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const node = wrapperRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const playing = inView && !hovered && !userPaused && !reducedMotion
  const duplicated = [...items, ...items]

  return (
    <div
      className="carousel"
      ref={wrapperRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <div
        className="carousel-track"
        style={{
          animationDuration: `${speed}s`,
          animationPlayState: playing ? 'running' : 'paused',
        }}
        role="group"
        aria-label={ariaLabel}
      >
        {duplicated.map((item, i) => (
          <div className="carousel-item" key={i} aria-hidden={i >= items.length || undefined}>
            {renderItem(item, i % items.length)}
          </div>
        ))}
      </div>
      {!reducedMotion && (
        <button
          type="button"
          className="carousel-toggle"
          onClick={() => setUserPaused((p) => !p)}
          aria-pressed={userPaused}
        >
          {userPaused ? 'Play' : 'Pause'} scrolling
        </button>
      )}
    </div>
  )
}
