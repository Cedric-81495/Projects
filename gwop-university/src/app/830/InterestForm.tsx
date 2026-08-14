'use client'

import { useState } from 'react'
import { event } from '@/content/event'
import {
  GHL_FORM_URL, INTERESTS, INTEREST_FALLBACK, QR_CODES, CAMPAIGN_PARAMS,
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

/* Felicia §3 + §7: one page, one QR destination, attribution on parameters.
   Allow-listed only — an arbitrary ?field=value in a scanned link must never
   reach Jake's form. Values are truncated; a pasted novel is not attribution. */
function readCampaign(): Array<[string, string]> {
  if (typeof window === 'undefined') return []
  const q = new URLSearchParams(window.location.search)
  return CAMPAIGN_PARAMS
    .map(k => [k, (q.get(k) ?? '').slice(0, 120)] as [string, string])
    .filter(([, v]) => v.length > 0)
}

export function InterestForm() {
  const [choice, setChoice] = useState<{ value: string; label: string } | null>(null)
  const [src, setSrc] = useState<string | null>(null)

  function choose(value: string, label: string, tag: string) {
    setChoice({ value, label })
    if (!GHL_FORM_URL) return setSrc(null)
    try {
      const u = new URL(GHL_FORM_URL)
      u.searchParams.set('interest', value)
      /* Jake's exact tag text travels with the lead, so his workflow can tag on
         a match rather than a lookup table that has to be kept in sync twice. */
      u.searchParams.set('interest_tag', tag)
      u.searchParams.set('s', readSource())
      for (const [k, v] of readCampaign()) u.searchParams.set(k, v)
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
            onClick={() => choose(i.value, i.label, i.tag)}
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
        onClick={() => choose(INTEREST_FALLBACK, 'general', 'Unspecified')}
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
