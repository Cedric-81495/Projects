'use client'

import { useEffect, useState } from 'react'

/**
 * BACK TO TOP.
 *
 * Rendered from <Footer>, which deliberately excludes /830 — the event page has
 * its own `.evfoot` and never imports this. That is not incidental: CLAUDE.md
 * invariant 7 keeps everything off the event page that is not the form, and a
 * floating control can land on top of the submit button on a small screen.
 *
 * Scrolling is done by the browser, not by JS animation. `html` already carries
 * `scroll-behavior:smooth`, and the reduced-motion query at the top of
 * globals.css switches it to `auto` — so someone who has asked their OS for less
 * motion gets an instant jump instead of a slide, without a second code path
 * here to maintain.
 *
 * `behavior:'smooth'` is passed anyway rather than relying solely on the CSS,
 * because Safari has historically honoured the JS option more reliably than the
 * stylesheet property on programmatic scrolls.
 */
export function BackToTop() {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    /* One viewport height before appearing. Any lower and the button flickers in
       and out while someone nudges a short page; any higher and it arrives after
       they have already started hunting for it. */
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.9)

    onScroll() // a reload can restore mid-page scroll, so seed the state

    /* passive: the handler never calls preventDefault, and saying so lets the
       browser keep scrolling on the compositor thread. Without it this listener
       can cost frames on a mid-range phone. */
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      className="totop"
      data-shown={shown || undefined}
      /* aria-hidden while off-screen so it is not a phantom stop in the tab
         order for a screen-reader user at the top of the page. */
      aria-hidden={!shown}
      tabIndex={shown ? 0 : -1}
      aria-label="Back to top"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        /* Move focus to the document so the next Tab starts from the top of the
           page. Without this, focus stays on a button that has just faded out
           and the following Tab lands back in the footer. */
        document.body.focus?.()
      }}
    >
      {/* Inline SVG rather than a text caret: a glyph like ↑ renders at a
          different weight and baseline in every font fallback. */}
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M12 19V6M12 6l-6 6M12 6l6 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
