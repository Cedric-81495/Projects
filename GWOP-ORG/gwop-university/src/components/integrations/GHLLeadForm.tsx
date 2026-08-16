'use client'

import { useEffect, useRef, useState } from 'react'
import { buildGhlEmbedUrl, GHL_EMBED_MODE } from '@/lib/ghl/embed'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THE ONLY PLACE A GOHIGHLEVEL EMBED APPEARS IN THIS CODEBASE (§5).
 *
 * Extracted from src/app/830/InterestForm.tsx so /event, /830 and any future
 * campaign page share one implementation. Replacing Jake's embed means editing
 * one env var — no page is redesigned, no second copy drifts out of sync.
 *
 * WHAT THIS COMPONENT DELIBERATELY DOES NOT HAVE:
 *   · no onSubmit handler        · no fetch or POST
 *   · no database write          · no local lead storage
 *   · no validation of the lead's fields
 *
 * GoHighLevel is the sole system of record for event leads (§4, §28). If a
 * future task asks this component to "also save the lead" or "queue it when
 * GHL is down", that is a second lead database and the answer is no — escalate
 * instead. See ARCHITECTURE.md §14.1 for the trade-off that was accepted.
 * ═══════════════════════════════════════════════════════════════════════════
 */

interface Props {
  /** Interest value forwarded to GHL, e.g. 'credit'. */
  interest?: string
  /** Jake's exact tag text, forwarded verbatim so his workflow matches on it. */
  interestTag?: string
  /** Accessible title for the iframe. */
  title?: string
  /** Minimum height while GHL has not yet reported its own. */
  minHeight?: number
  className?: string
}

export function GHLLeadForm({
  interest,
  interestTag,
  title = 'GWOP signup form',
  minHeight = 620,
  className,
}: Props) {
  const [src, setSrc] = useState<string | null>(null)
  const [height, setHeight] = useState(minHeight)
  const frameRef = useRef<HTMLIFrameElement>(null)

  // Built on the client, at mount, from window.location. This keeps the host
  // page fully static so it is served from the CDN edge — on congested venue
  // cellular that is the difference between a fast page and a slow one.
  useEffect(() => {
    setSrc(buildGhlEmbedUrl({ interest, interestTag, search: window.location.search }))
  }, [interest, interestTag])

  // GHL posts its content height as it grows. Without this the form is clipped
  // on a short phone, or floats in a tall empty box on a tall one.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      // Origin check: only the frame we actually loaded may resize us.
      if (!src) return
      let expected: string
      try {
        expected = new URL(src).origin
      } catch {
        return
      }
      if (e.origin !== expected) return

      const raw = typeof e.data === 'object' && e.data !== null ? e.data : null
      const next = Number((raw as { height?: unknown })?.height)
      if (Number.isFinite(next) && next > 200 && next < 5000) {
        setHeight(Math.max(next, minHeight))
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [src, minHeight])

  // Unset env var: show a visible placeholder rather than an empty box, so a
  // missing configuration is obvious in review instead of silently shipping.
  if (!src) {
    return (
      <div className={className} data-ghl-placeholder role="status">
        <b>GoHighLevel form loads here</b>
        <span>
          Set <code>NEXT_PUBLIC_GHL_FORM_URL</code> to Jake&rsquo;s embed URL.
        </span>
      </div>
    )
  }

  // Script-mode embeds are supported because GHL ships either form depending
  // on how the funnel was built. Same URL source, different delivery.
  if (GHL_EMBED_MODE === 'script') {
    return (
      <div className={className} style={{ minHeight }}>
        <div data-ghl-script-slot data-src={src} />
      </div>
    )
  }

  return (
    <div className={className} style={{ minHeight }}>
      <iframe
        ref={frameRef}
        src={src}
        title={title}
        loading="eager"
        style={{ width: '100%', height, border: 0, display: 'block' }}
        /* Least privilege. forms + scripts + same-origin is what a GHL form
           needs; popups and top-navigation are not granted, so the embed can
           never navigate the page out from under the attendee. */
        sandbox="allow-forms allow-scripts allow-same-origin"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}
