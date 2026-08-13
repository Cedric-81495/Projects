'use client'

import { useState } from 'react'
import { event } from '@/content/event'
import {
  GHL_FORM_URL, INTERESTS, INTEREST_FALLBACK, DRAFT, QR_CODES,
} from '@/config/integrations'

/* The only client component on /830.
   Implements Visual Build Package p.6: CHOOSE → CAPTURE.

   The QR source is read from the URL lazily, at click time, rather than via
   searchParams on the server — that keeps /830 fully static so it is served
   from the CDN edge. On congested venue cellular that is the difference
   between a fast page and a slow one (CLAUDE.md invariant 15). */
function readSource(): string {
  if (typeof window === 'undefined') return 'direct'
  const s = new URLSearchParams(window.location.search).get('s')
  const known = Object.values(QR_CODES) as readonly string[]
  return s && known.includes(s) ? s : s === 'unknown' ? 'unknown' : 'direct'
}

export function InterestForm() {
  const [choice, setChoice] = useState<{ value: string; label: string } | null>(null)
  const [src, setSrc] = useState<string | null>(null)

  function choose(value: string, label: string) {
    setChoice({ value, label })
    if (!GHL_FORM_URL) return setSrc(null)
    try {
      const u = new URL(GHL_FORM_URL)
      u.searchParams.set('interest', value)
      u.searchParams.set('s', readSource())
      setSrc(u.toString())
    } catch {
      setSrc(null) // malformed env value — show the placeholder instead of breaking
    }
  }

  return (
    <>
      <div className="evpicks">
        {INTERESTS.map(i => (
          <button
            key={i.value}
            type="button"
            className="evpick"
            aria-pressed={choice?.value === i.value}
            {...(DRAFT && 'pending' in i ? { 'data-tbc': '' } : {})}
            onClick={() => choose(i.value, i.label)}
          >
            <span className="dot" />
            {i.label}
          </button>
        ))}
      </div>

      {/* Without this, anyone who won't categorise themselves is a lost lead.
          Jake needs a default nurture branch for INTEREST_FALLBACK. */}
      <button
        type="button"
        className="evskip"
        onClick={() => choose(INTEREST_FALLBACK, 'general')}
      >
        {event.choose.skip}
      </button>

      {choice && (
        <div className="evform">
          <div className="fh">
            <h3>{event.form.step}</h3>
            <p>
              Interested in <span className="chosen">{choice.label}</span>. {event.form.note}
            </p>
          </div>
          <div className="evslot">
            {src ? (
              <iframe src={src} title="GWOP signup form" loading="eager" />
            ) : (
              <div className="evph">
                <b>Jake&rsquo;s GoHighLevel form loads here</b>
                <span>
                  Set <code>NEXT_PUBLIC_GHL_FORM_URL</code> in <code>.env.local</code>.
                  Tracker task 3.
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
