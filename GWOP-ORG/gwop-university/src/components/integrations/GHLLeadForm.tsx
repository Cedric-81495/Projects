'use client'

import { useEffect, useState } from 'react'
import { buildGhlEmbedUrl, GHL_EMBED_MODE } from '@/lib/ghl/embed'

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * THE ONLY PLACE A GOHIGHLEVEL EMBED APPEARS IN THIS CODEBASE (§5).
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

/** GHL's resize + redirect-breakout helper. Loaded on the PARENT page. */
const GHL_EMBED_SCRIPT = 'https://link.msgsndr.com/js/form_embed.js'

interface Props {
  interest?: string
  interestTag?: string
  title?: string
  /**
   * Floor height, used until GHL reports its own.
   *
   * 700 not 620: Jake's form is four fields plus legal links (~660px), and an
   * SMS consent checkbox is still to be added, which makes it taller again. A
   * floor that is too low produces a scrollbar INSIDE the frame — on a phone
   * the Submit button then sits below the fold of a box the attendee does not
   * realise scrolls, which is a lost lead with no error anywhere.
   */
  minHeight?: number
  className?: string
}

export function GHLLeadForm({
  interest,
  interestTag,
  title = 'GWOP signup form',
  minHeight = 700,
  className,
}: Props) {
  const [src, setSrc] = useState<string | null>(null)
  const [height, setHeight] = useState(minHeight)

  // Built on the client, at mount, from window.location. This keeps the host
  // page fully static so it is served from the CDN edge — on congested venue
  // cellular that is the difference between a fast page and a slow one.
  useEffect(() => {
    setSrc(buildGhlEmbedUrl({ interest, interestTag, search: window.location.search }))
  }, [interest, interestTag])

  /* ── GHL's embed script ────────────────────────────────────────────────────
     Two jobs, and BOTH were missing before:

       1. It is what makes GHL post its content height. Without it the height
          listener below never fires and the frame stays at the floor value —
          the nested-scrollbar bug.
       2. It breaks the post-submit redirect out to top level. Without it the
          thank-you page renders inside the iframe, in a ~700px box.

     Injected once, shared by iframe and script mode. Idempotent — a second
     mount reuses the existing tag rather than loading it twice.

     ⚠ CSP: middleware.ts must allow link.msgsndr.com in `script-src`, or this
     is blocked silently and both symptoms above return.
     ───────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!src) return
    if (document.querySelector(`script[src="${GHL_EMBED_SCRIPT}"]`)) return
    const tag = document.createElement('script')
    tag.src = GHL_EMBED_SCRIPT
    tag.async = true
    document.body.appendChild(tag)
  }, [src])

  // GHL posts its content height as it grows. Without this the form is clipped
  // on a short phone, or floats in a tall empty box on a tall one.
  useEffect(() => {
    function onMessage(e: MessageEvent) {
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

  /* Script-mode embeds are supported because GHL ships either form depending on
     how the funnel was built.

     PREVIOUSLY BROKEN: this branch rendered an empty <div data-ghl-script-slot>
     and nothing ever loaded a script, so script mode silently produced a blank
     box. form_embed.js (injected above) hydrates the attribute contract below. */
  if (GHL_EMBED_MODE === 'script') {
    const formId = (() => {
      try {
        return new URL(src).pathname.split('/').filter(Boolean).pop() ?? ''
      } catch {
        return ''
      }
    })()

    return (
      <div className={className} style={{ minHeight }}>
        <iframe
          src={src}
          title={title}
          id={`inline-${formId}`}
          data-layout='{"id":"INLINE"}'
          data-form-id={formId}
          data-form-name={title}
          data-height={String(minHeight)}
          data-layout-iframe-id={`inline-${formId}`}
          style={{ width: '100%', height, border: 0, display: 'block' }}
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    )
  }

  return (
    <div className={className} style={{ minHeight }}>
      <iframe
        src={src}
        title={title}
        loading="eager"
        style={{ width: '100%', height, border: 0, display: 'block' }}
        /* Least privilege, with ONE addition over the original.
​
           `allow-top-navigation-by-user-activation` is required for Jake's
           post-submit redirect to reach /thanks at top level. Without it the
           thank-you page loads inside this frame and reads as broken.
​
           This is narrower than `allow-top-navigation`: navigation is permitted
           only in response to a real user gesture (the Submit click), so the
           embed still cannot navigate the page unprompted — which was the point
           of the original restriction. Popups remain denied.
​
           ⚠ This relaxes a constraint documented as deliberate. Confirm with
           whoever wrote it before merging; the alternative is to keep the
           sandbox as-is and host the thank-you content inside GHL instead. */
        sandbox="allow-forms allow-scripts allow-same-origin allow-top-navigation-by-user-activation"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  )
}