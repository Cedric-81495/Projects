'use client'

import { useRef, useState } from 'react'
import Script from 'next/script'
import { AsYouType, isValidPhoneNumber } from 'libphonenumber-js'
import { event } from '@/content/event'
import { Assessment } from './Assessment'
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

/* Felicia, Aug 20: "we'll have the website as the primary source, but we also
   need to account for event/QR leads... I'd like those sources identified
   separately in GHL so we can track where leads are coming from."

   That separation already existed — a scanned code arrives as its staff role,
   anything else did not. But the fallback was labelled `direct`, which in a CRM
   reads as "direct traffic" rather than "came through the website form". Renamed
   to `website` so the two groups are self-describing in Jake's reporting:

     website                                        → someone found the site
     booth-lead | greeter | ambassador |            → scanned a printed code,
     signup-specialist | content-floater              identified by which one
     unknown                                        → an `s` value we don't
                                                      recognise; kept distinct so
                                                      a mis-printed code shows up
                                                      as a number rather than
                                                      silently joining `website` */
function readSource(): string {
  if (typeof window === 'undefined') return 'website'
  const s = new URLSearchParams(window.location.search).get('s')
  const known = Object.values(QR_CODES) as readonly string[]
  return s && known.includes(s) ? s : s === 'unknown' ? 'unknown' : 'website'
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

/* Distinguishes the failure modes that need different words. A plain Error
   carries a message we want to show verbatim; these carry a kind we map below. */
class NetworkError extends Error {
  constructor(readonly kind: 'offline' | 'timeout' | 'unreachable' | 'server') {
    super(kind)
  }
}

/**
 * Turns a thrown value into something worth reading at a booth.
 *
 * Every failure used to render "Something went wrong. Please try again." — true,
 * but useless: it does not say whether to retry now, move somewhere with signal,
 * or fetch someone. On a congested venue network the connection is the likely
 * cause, and a staffer needs to know that in the two seconds they have.
 *
 * Each message says what happened and what to do next, and none of them blame
 * the attendee for something the network did. Nothing they typed is lost — the
 * fields keep their values, so retrying is one tap.
 */
/* Fields in the order they appear on screen. Reported errors are an object, so
   iterating it would follow key order rather than reading order and could send
   someone to the third field when the first is also wrong. */
const FIELD_ORDER = ['first_name', 'phone', 'email'] as const

/**
 * Move to the first field that needs attention.
 *
 * Without this, tapping Send with an empty name did nothing visible: the message
 * rendered beside a field that was already scrolled off the top, so the attendee
 * saw only "Some fields need attention" — or on a small screen, nothing at all —
 * and tapped Send again.
 *
 * focus() rather than scrollIntoView alone. Focusing scrolls the field into view
 * anyway, puts the caret where the person needs to type, and is what announces
 * the problem to a screen reader. Scrolling alone does none of those.
 */
function focusFirstInvalid(form: HTMLFormElement | null, errs: FieldErrors) {
  if (!form) return
  const name = FIELD_ORDER.find(f => errs[f])
  if (!name) return

  const el = form.querySelector<HTMLInputElement>(`[name="${name}"]`)
  if (!el) return

  /* preventScroll then scrollIntoView with block:'center': the browser's own
     focus scroll pins the field to the very edge of the viewport, often under
     the sticky bar. Centring it puts the label and the error message on screen
     together. */
  el.focus({ preventScroll: true })
  el.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto' : 'smooth',
    block: 'center',
  })
}

function describeFailure(err: unknown): string {
  /* AbortError is what our own 15s timeout produces. */
  if (err instanceof DOMException && err.name === 'AbortError') {
    return 'That took too long — the connection here looks slow. Tap Send again.'
  }

  if (err instanceof NetworkError) {
    switch (err.kind) {
      case 'offline':
        return 'Your phone is offline. Reconnect to wifi or data, then tap Send again — nothing you typed has been lost.'
      case 'server':
        return 'Our end had a problem, not yours. Tap Send again in a moment.'
      default:
        return 'Could not reach us — the signal here may be weak. Move a few steps and tap Send again.'
    }
  }

  /* fetch() rejects with a TypeError when the request never left the device:
     DNS failure, connection dropped, captive portal. This is the common one on
     venue wifi. */
  if (err instanceof TypeError) {
    return 'Could not reach us — the signal here may be weak. Move a few steps and tap Send again.'
  }

  /* Anything else is a validation message from our own API, already written for
     the person reading it. */
  return err instanceof Error && err.message
    ? err.message
    : 'Something went wrong. Please tap Send again.'
}

export function InterestForm() {
  const [choice, setChoice] = useState<Choice | null>(null)
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)

  /* Set once the lead is saved. From here the seven questions take over this
     page — see Assessment.tsx for why it stays on the same page load. */
  const [captured, setCaptured] = useState<{ token: string; firstName: string } | null>(null)

  function onCaptured(token: string, firstName: string) {
    setCaptured({ token, firstName })
  }

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

  /* The lead is saved and the questions take the page. Rendered instead of the
     picker and form rather than below them, so nobody scrolls back up and
     re-submits a form that has already succeeded. */
  if (captured) {
    return (
      <div className="evstage">
        <Assessment
          token={captured.token}
          firstName={captured.firstName}
          initialInterest={choice?.value ?? INTEREST_FALLBACK}
        />
      </div>
    )
  }

  /* ── ONE STAGE, MANY STATES ──────────────────────────────────────────────
     Everything interactive lives inside .evstage: the picker, the form, the
     seven questions, the review and the Blueprint.

     Why it is one element rather than several siblings — the form is roughly
     twice the height of a question screen, so when it was replaced the whole
     page collapsed by a few hundred pixels. The pathway section below jumped
     up, the attendee's scroll position was suddenly pointing at different
     content, and the next question landed off the top of the viewport. They
     had scrolled nowhere; the page moved underneath them.

     The stage holds a floor height, so a shorter state cannot pull the page
     up. The top edge stays where it is, which means the attendee stays looking
     at the same place for the whole flow. Taller states still grow downward —
     that is fine, because everything they care about is anchored at the top. */
  return (
    <div className="evstage">
      <p className="tag">{event.choose.step}</p>
      <h2>{event.choose.h2}</h2>
      <p className="evlede">{event.choose.lede}</p>

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
            : <NativeForm choice={choice} onCaptured={onCaptured} />}
        </div>
      )}
    </div>
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

function NativeForm({
  choice,
  onCaptured,
}: {
  choice: Choice
  onCaptured: (token: string, firstName: string) => void
}) {
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  /* Controlled so AsYouType can reformat as they type. The server re-parses
     the same string with the same library, so what passes here passes there. */
  const [phone, setPhone] = useState('')

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
    /* Same function the route uses, so the verdict cannot disagree. The old
       10-digit check passed numbers the server then rejected — the attendee
       waited out a round trip on venue cellular to be told no. */
    if (!isValidPhoneNumber(String(fd.get('phone') ?? ''), 'US')) {
      next.phone = 'Enter a valid US mobile number'
    }
    /* Consent is deliberately NOT validated. Jake, 2026-08-19: optional and
       unchecked by default. The approved wording says "Consent is not a
       condition of purchase" — blocking submit would contradict the sentence
       sitting right beside the box. */

    if (Object.keys(next).length) {
      setErrors(next)
      focusFirstInvalid(formRef.current, next)
      return
    }

    /* Catch a missing challenge token BEFORE the round trip.
       The token is empty when Turnstile has not finished loading, when its
       script was blocked, or when the challenge expired while the form sat open
       — which happens at a booth, where someone starts typing, gets talked to,
       and comes back a few minutes later.

       Without this the request goes out, the server rejects it, and the attendee
       waits out a round trip on venue cellular to be told something they cannot
       act on. Catching it here is instant and says what to do. */
    const token = String(fd.get('cf-turnstile-response') ?? '')
    /* Guarded on siteKey: with no key the widget never renders, the token is
       always empty, and this check would block every submission. The server
       skips verification in that case too, so the two stay consistent. */
    if (siteKey && !token) {
      setErrors({})
      setFormError(
        'The security check has not finished. Give it a moment, then tap Send again — nothing you typed has been lost.',
      )
      return
    }

    setErrors({})
    setPending(true)
    setFormError(null)

    /* A request with no timeout can hang indefinitely on a congested cell
       network — the spinner spins, the staffer does not know whether it is
       working, and the queue builds. 15s is long enough for a genuinely slow
       connection and short enough that nobody stands there guessing. */
    const abort = new AbortController()
    const timer = setTimeout(() => abort.abort(), 15_000)

    try {
      /* Checked before the request rather than inferring it from the failure:
         if the device knows it is offline, say so immediately instead of making
         someone wait 15 seconds to be told. */
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        throw new NetworkError('offline')
      }

      const res = await fetch('/api/lead', {
        method: 'POST',
        signal: abort.signal,
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
        /* 5xx is our side falling over, not anything the attendee did. Worth
           separating so the message does not imply they typed something wrong. */
        if (res.status >= 500) throw new NetworkError('server')
        const body = await res.json().catch(() => null)
        throw new Error(body?.error?.message ?? 'Something went wrong. Please try again.')
      }

      /* CHANGED 2026-08-22, Felicia's beta-assessment brief.
         Was: hard navigation to /thanks.
         Now: the lead is saved, so the attendee is safe, and the seven
         questions run on this page.

         Staying put is the point. A navigation here would reload /830, which is
         where the third-party chat widget gets a second chance to inject its
         own copy of Turnstile — the failure that 422s every submission. It also
         costs a round trip on venue cellular between capture and question one,
         which is exactly where someone hands the phone back.

         /thanks still exists and is still the destination if anything below
         fails to mount. */
      const payload = (await res.json().catch(() => null)) as
        | { data?: { id?: string; assessment_token?: string } }
        | null

      const token = payload?.data?.assessment_token
      if (!token) {
        /* Lead is saved either way — this only means we cannot attach answers
           to it. Confirmation beats a broken assessment. */
        setDone(true)
        window.location.assign('/thanks')
        return
      }

      setDone(true)
      onCaptured(token, String(fd.get('first_name') ?? '').trim())
    } catch (err: unknown) {
      setPending(false)
      setFormError(describeFailure(err))
    } finally {
      clearTimeout(timer)
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
    <form className="evnf" ref={formRef} onSubmit={onSubmit} noValidate>
      <div className="evnf-row">
        <label>
          First name
          {/* aria-invalid + aria-describedby so a screen reader announces the
              problem and reads the message when focus lands here. Without them
              the field is announced as ordinary and the <em> beside it is never
              connected to anything. */}
          <input
            name="first_name"
            autoComplete="given-name"
            enterKeyHint="next"
            aria-invalid={errors.first_name ? true : undefined}
            aria-describedby={errors.first_name ? 'err-first_name' : undefined}
            required
          />
          {errors.first_name && <em id="err-first_name">{errors.first_name}</em>}
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
          /* 555 is NOT an assigned US area code — the old placeholder was a
             number the API rejects. 415 is real; 555-01xx is the reserved
             fictional range, so a booth demo can never text a real person. */
          placeholder="(415) 555-0123"
          maxLength={16}
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? 'err-phone' : undefined}
          value={phone}
          onChange={(e) => {
            /* Backspace must be able to delete a formatting character.
               Reformatting the raw digits on every keystroke would re-insert
               the ')' the user just removed and trap the caret. */
            const raw = e.target.value
            setPhone(
              raw.length < phone.length ? raw : new AsYouType('US').input(raw),
            )
            if (errors.phone) setErrors((p) => ({ ...p, phone: undefined }))
          }}
          /* On blur, not on keystroke: mid-typing, a correct number is
             invalid for its first nine digits. */
          onBlur={() =>
            setErrors((p) => ({
              ...p,
              phone:
                phone && !isValidPhoneNumber(phone, 'US')
                  ? 'Enter a valid US mobile number'
                  : undefined,
            }))
          }
          required
        />
        {errors.phone && <em id="err-phone">{errors.phone}</em>}
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
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'err-email' : undefined}
          required
        />
        {errors.email && <em id="err-email">{errors.email}</em>}
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