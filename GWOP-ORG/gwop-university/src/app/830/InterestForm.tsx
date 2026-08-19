'use client'

import { useState } from 'react'
import Script from 'next/script'
import { event } from '@/content/event'
import { publicEnv } from '@/lib/env.public'
import {
  GHL_FORM_URL, INTERESTS, INTEREST_FALLBACK, QR_CODES, CAMPAIGN_PARAMS,
} from '@/config/integrations'

/* ═══════════════════════════════════════════════════════════════════════════
   /830 — CHOOSE → CAPTURE (Visual Build Package p.6)

   Two capture paths live here, chosen by NEXT_PUBLIC_LEAD_CAPTURE_MODE:

     'native' (default) — our own form → POST /api/lead → Supabase → GHL.
                          Felicia approved this on Aug 18.
     'iframe'           — Jake's embedded GHL form. The fallback she asked to
                          keep live until the native path passes end-to-end.

   ⚠ Switching between them must stay an ENV CHANGE, not a code change. On
   event day a revert has to take thirty seconds, not a redeploy. Do not delete
   the iframe branch until sign-off.

   The QR source is read from the URL lazily, at click time, rather than via
   searchParams on the server — that keeps /830 fully static so it is served
   from the CDN edge. On congested venue cellular that is the difference
   between a fast page and a slow one (CLAUDE.md invariant 15).
   ═══════════════════════════════════════════════════════════════════════════ */

const MODE = publicEnv.NEXT_PUBLIC_LEAD_CAPTURE_MODE ?? 'native'

function readSource(): string {
  if (typeof window === 'undefined') return 'direct'
  const s = new URLSearchParams(window.location.search).get('s')
  const known = Object.values(QR_CODES) as readonly string[]
  return s && known.includes(s) ? s : s === 'unknown' ? 'unknown' : 'direct'
}

/* Felicia §3 + §7: one page, one QR destination, attribution on parameters.
   Allow-listed only — an arbitrary ?field=value in a scanned link must never
   reach the payload. Values truncated; a pasted novel is not attribution. */
function readCampaign(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const q = new URLSearchParams(window.location.search)
  const out: Record<string, string> = {}
  for (const k of CAMPAIGN_PARAMS) {
    const v = (q.get(k) ?? '').slice(0, 120)
    if (v) out[k] = v
  }
  return out
}

interface Choice { value: string; label: string; tag: string }

export function InterestForm() {
  const [choice, setChoice] = useState<Choice | null>(null)
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)

  function choose(value: string, label: string, tag: string) {
    setChoice({ value, label, tag })
    if (MODE !== 'iframe') return

    if (!GHL_FORM_URL) return setIframeSrc(null)
    try {
      const u = new URL(GHL_FORM_URL)
      u.searchParams.set('interest', value)
      u.searchParams.set('interest_tag', tag)
      u.searchParams.set('s', readSource())
      for (const [k, v] of Object.entries(readCampaign())) u.searchParams.set(k, v)
      setIframeSrc(u.toString())
    } catch {
      setIframeSrc(null)
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
        onClick={() => choose(INTEREST_FALLBACK, 'everything', 'Unspecified')}
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

          {MODE === 'iframe'
            ? <IframeFallback src={iframeSrc} />
            : <NativeForm choice={choice} />}
        </div>
      )}
    </>
  )
}

/* ── FALLBACK PATH ─────────────────────────────────────────────────────────
   Unchanged behaviour, retained per Felicia's instruction. */
function IframeFallback({ src }: { src: string | null }) {
  return (
    <div className="evslot">
      {src ? (
        <iframe src={src} title="GWOP signup form" loading="eager" />
      ) : (
        <div className="evph">
          <b>Jake&rsquo;s GoHighLevel form loads here</b>
          <span>Set <code>NEXT_PUBLIC_GHL_FORM_URL</code> to use the fallback path.</span>
        </div>
      )}
    </div>
  )
}

/* ── PRIMARY PATH ──────────────────────────────────────────────────────────
   Four fields and a consent box. Deliberately no more: every extra field costs
   conversions with a staff member standing at the table waiting.
   ───────────────────────────────────────────────────────────────────────── */

type FieldErrors = Partial<Record<'first_name' | 'email' | 'phone', string>>

function NativeForm({ choice }: { choice: Choice }) {
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})

  const siteKey = publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const consent = event.consent

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return

    const fd = new FormData(e.currentTarget)
    const next: FieldErrors = {}

    /* Checked here as well as server-side, purely so the attendee sees the
       problem next to the field instead of after a round trip on slow cellular.
       /api/lead re-validates everything; this is not the guard. */
    if (!String(fd.get('first_name') ?? '').trim()) next.first_name = 'Required'
    if (!String(fd.get('email') ?? '').includes('@')) next.email = 'Enter a valid email'
    if (String(fd.get('phone') ?? '').replace(/\D/g, '').length < 10) {
      next.phone = 'Enter a valid mobile number'
    }
    /* Consent is deliberately NOT validated. Jake, 2026-08-19: optional and
       unchecked by default. The approved wording says "Consent is not a
       condition of purchase" — blocking submit would contradict the sentence
       sitting right beside the box. */

    if (Object.keys(next).length) return setErrors(next)
    setErrors({})
    setPending(true)
    setFormError(null)

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          first_name: String(fd.get('first_name') ?? '').trim(),
          last_name: String(fd.get('last_name') ?? '').trim(),
          email: String(fd.get('email') ?? '').trim(),
          phone: String(fd.get('phone') ?? '').trim(),
          interest: choice.value,
          interest_tag: choice.tag,
          source: readSource(),
          utm: readCampaign(),
          consent_given: fd.get('consent') === 'yes',
          /* The exact sentence rendered above travels with the submission, so
             the stored record matches what was actually on screen. */
          consent_text: consent.text,
          turnstile_token: String(fd.get('cf-turnstile-response') ?? ''),
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error?.message ?? 'Something went wrong. Please try again.')
      }

      /* Full navigation, not a client-side push: the thank-you page must render
         even if this component's JS has since failed, and a hard load is what
         guarantees the attendee sees confirmation. */
      setDone(true)
      window.location.assign('/thanks')
    } catch (err: unknown) {
      setPending(false)
      setFormError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  /* Consent wording is not approved yet. The mechanism is built and testable,
     but a placeholder must not reach an attendee — so the form refuses to
     render rather than shipping unapproved legal text.
     Flip event.consent.pending to false once Felicia supplies the sentence. */
  if (consent.pending) {
    return (
      <div className="evph" role="status">
        <b>Signup form ready — awaiting approved SMS consent wording</b>
        <span>
          The form is built and tested. It stays hidden until the consent
          sentence is confirmed, so placeholder legal text cannot go live.
          Set <code>event.consent.pending = false</code> once approved.
        </span>
      </div>
    )
  }

  return (
    <form className="evnf" onSubmit={onSubmit} noValidate>
      <div className="evnf-row">
        <label>
          First name
          <input name="first_name" autoComplete="given-name" enterKeyHint="next" required />
          {errors.first_name && <em>{errors.first_name}</em>}
        </label>
        <label>
          Last name
          <input name="last_name" autoComplete="family-name" enterKeyHint="next" />
        </label>
      </div>

      <label>
        Mobile number
        {/* type=tel brings up the numeric keypad. inputMode reinforces it on
            Android, where type alone is not always enough. */}
        <input
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          enterKeyHint="next"
          placeholder="(555) 000-0000"
          required
        />
        {errors.phone && <em>{errors.phone}</em>}
      </label>

      <label>
        Email
        <input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          enterKeyHint="done"
          placeholder="you@email.com"
          required
        />
        {errors.email && <em>{errors.email}</em>}
      </label>

      {/* Unchecked by default and never pre-ticked — the stored record is only
          meaningful if the attendee actually performed the action. Optional
          per Jake: declining still captures the lead, it just carries
          sms_consent: false into GHL. */}
      <label className="evnf-consent">
        <input type="checkbox" name="consent" value="yes" />
        <span>
          {consent.text}
          {/* Required beside the consent language for A2P compliance — the
              terms being agreed to have to be reachable from the same place
              the agreement is given. */}
          <span className="evnf-legal">
            <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            {' · '}
            <a href="/terms" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a>
            {' · '}
            <a href="/sms-terms" target="_blank" rel="noopener noreferrer">SMS Terms</a>
          </span>
        </span>
      </label>

      {siteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
          <div className="cf-turnstile" data-sitekey={siteKey} data-theme="light" />
        </>
      )}

      {formError && <p className="evnf-err" role="alert">{formError}</p>}

      <button className="btn btn-e evnf-submit" type="submit" disabled={pending || done}>
        {pending ? 'Sending…' : done ? 'Done' : event.form.submit ?? 'Send my blueprint'}
      </button>

      <p className="evnf-fine">{consent.fine}</p>
    </form>
  )
}
