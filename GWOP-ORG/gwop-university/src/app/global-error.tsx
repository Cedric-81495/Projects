'use client'

import { useEffect } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════
   GLOBAL ERROR — THE LAST LINE — ADDED 2026-09-21

   Fires only when the ROOT layout itself throws. error.tsx cannot catch that,
   because error.tsx renders INSIDE the layout that just failed.

   ⚠ IT REPLACES <html> AND <body>. That is required, not stylistic: the layout
   that would have supplied them is the thing that broke. Every other boundary
   returns a fragment; this one must not.

   ⚠ EVERY STYLE HERE IS INLINE, ON PURPOSE. globals.css is imported by the
   root layout. If the layout failed, the stylesheet may never have loaded, and
   a className would render as unstyled black-on-white. The fonts are named as
   a stack rather than the CSS variables for the same reason — next/font sets
   those variables in the layout.

   ⚠ NO IMPORTS FROM @/components. <Crest> pulls next/image and the font
   config, which is exactly the chain most likely to have caused this. A file
   whose job is to work when nothing else does should depend on nothing else.

   ⚠ NO LINK COMPONENT. Client-side routing needs a working router; a plain
   <a> does a full page load, which is what you want when the app shell is
   broken anyway.

   If you are reading this because it fired: it means the failure is in the
   root layout, its imports, or the font loading. Not in a page.
   ═══════════════════════════════════════════════════════════════════════════ */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('global_error_boundary', { digest: error.digest, message: error.message })
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0E241A',
          color: '#F7F3E9',
          fontFamily: "Georgia, 'Times New Roman', serif",
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '34rem', textAlign: 'center' }}>
          <p
            style={{
              fontSize: '12px',
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: '#D9B45C',
              fontFamily: 'system-ui, sans-serif',
              margin: '0 0 14px',
            }}
          >
            GWOP University
          </p>
          <h1 style={{ fontSize: 'clamp(28px,5vw,40px)', margin: '0 0 16px', fontWeight: 700 }}>
            The site is having a problem.
          </h1>
          <p style={{ fontSize: '16px', lineHeight: 1.6, opacity: 0.85, margin: '0 0 28px' }}>
            This is on our side. Your account and any purchase you have made are
            unaffected.
          </p>
          <button
            onClick={reset}
            style={{
              background: '#C8A34A',
              color: '#152C21',
              border: 0,
              borderRadius: '999px',
              padding: '15px 30px',
              minHeight: '52px',
              fontSize: '15.5px',
              fontWeight: 600,
              fontFamily: 'system-ui, sans-serif',
              cursor: 'pointer',
            }}
          >
            Reload the page
          </button>
          {error.digest && (
            <p style={{ marginTop: '24px', fontSize: '13px', opacity: 0.6 }}>
              Reference {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
