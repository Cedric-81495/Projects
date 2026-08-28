'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ASSESSMENT_QUESTIONS,
  TOTAL_STEPS,
  labelFor,
  type AssessmentField,
} from '@/config/assessment'
import { blueprints, BLUEPRINTS_APPROVED, type BlueprintSlug } from '@/content/blueprints'
import { event } from '@/content/event'
import { Tbc } from '@/components/Chrome'
import { INTERESTS, INTEREST_FALLBACK } from '@/config/integrations'
import { identityiq } from '@/config/identityiq'
import { BOOKING_URL } from '@/config/integrations'
import { teaser } from '@/config/teaser'

/* ═══════════════════════════════════════════════════════════════════════════
   THE SEVEN QUESTIONS — Felicia, 2026-08-21.

   Runs immediately after the contact form succeeds, on the same page. There is
   no navigation between questions and that is deliberate: a client-side route
   change on /830 is what let the chat widget load a second Turnstile and 422
   every submission. See NoThirdPartyWidgets.tsx. Pure state, one page load.

   ── WHAT THIS IS OPTIMISED FOR ────────────────────────────────────────────
   Someone standing in a noisy room, holding a phone one-handed, with a staff
   member waiting and a queue behind them. Not for elegance.

   · One question per screen. Tapping an option advances — no Next button to
     find, which halves the taps for the whole flow.
   · Every answer posts the moment it is tapped, in the background. A locked
     phone at Q5 costs nothing; they reopen and carry on.
   · A failed save never blocks progress. The attendee keeps moving and the
     answer retries on the next tap. Their time at the table is worth more than
     a perfectly complete row.
   · Skip is always visible. An honest skip is better data than a guessed
     answer, and refusing to let someone past a question they do not want to
     answer is how you lose the remaining six.
   ═══════════════════════════════════════════════════════════════════════════ */

interface Props {
  token: string
  /** Rendered above the first question so the handoff does not feel like a reset. */
  firstName: string
  /** What they picked before the form, so step one shows it already selected. */
  initialInterest: string
}

type Answers = Partial<Record<AssessmentField, string>>


/* Step 0 is the interest question. Steps 1..6 are ASSESSMENT_QUESTIONS.

   Q1 used to sit outside this component entirely, above the contact form, which
   made it the one answer nobody could go back and change — and it is one of the
   two that decides which roadmap someone gets. Mis-tap it and the Blueprint was
   wrong with no way back short of starting again.

   It still WRITES to leads.interest, because that is Jake's field. Only its
   position in the flow moved. */
const INTEREST_STEP = 0
const firstQuestionStep = 1
/* One past the last question. Answers are reviewed here before anything is
   submitted, and nothing is editable afterwards. */
const REVIEW_STEP = ASSESSMENT_QUESTIONS.length + 1

export function Assessment({ token, firstName, initialInterest }: Props) {
  const [step, setStep] = useState(firstQuestionStep)
  const [answers, setAnswers] = useState<Answers>({})
  const [interest, setInterest] = useState(initialInterest)
  const [blueprint, setBlueprint] = useState<BlueprintSlug | null>(null)
  /* Covers the gap between the last tap and the roadmap appearing. Every other
     answer is optimistic — the screen advances immediately and the save happens
     behind it — but the final one genuinely has to wait, because the answer
     decides which Blueprint comes back. On venue cellular that can be a couple
     of seconds, and a screen that does nothing after a tap is a screen someone
     taps again. */
  const [building, setBuilding] = useState(false)

  /* ── WHY THIS EXISTS ──────────────────────────────────────────────────────
     The assessment replaces the form in place, and the form sits a long way
     down a long page. Three things went wrong without it:

     · The form is roughly twice the height of a question screen, so the page
       collapsed underneath the attendee at the moment they submitted and the
       first question landed off the top of the viewport. They saw the section
       below it and assumed nothing had happened.
     · Every later question is a different height too, so the content kept
       shifting under their thumb.
     · Focus stayed on the button they had just tapped, which no longer exists.
       Keyboard and screen-reader users were dropped back at the top of the
       document with no announcement.

     So: after every change, put the top of this section at the top of the
     viewport and move focus to the new heading. Predictable beats clever here —
     the same thing happens every time, so it stops being a surprise by the
     second question.
     ───────────────────────────────────────────────────────────────────────── */
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const heading = headingRef.current
    if (!heading) return

    /* ⚠ NO FIRST-MOUNT EXEMPTION. There used to be one, on the reasoning that
       "on submit the browser is already sitting on the form, which is where
       this section is, so moving would be a jolt with no purpose."

       That holds only when the form is short. It is not: the form is roughly
       twice the height of a question screen, and the attendee has just
       scrolled to its BOTTOM to reach Send. So the top of the stage is above
       the viewport, question one renders up there, and they are left looking
       at the section below with no visible indication anything happened.
       Reported 2026-08-28 on both mobile and desktop.

       The comfort check below already refuses to move when the stage is
       comfortably in view, so running it on mount cannot reintroduce the
       jumping it was written to prevent. It simply covers the one transition
       that was exempt from it. */

    /* ── ONLY MOVE IF WE HAVE TO ────────────────────────────────────────────
       This used to scroll on every single answer, which is the jumping. On a
       phone the section usually fills most of the screen already, so the
       question that replaces it is right where the attendee is looking —
       scrolling then yanks the page for no reason, and it happens six times in
       a row.

       So: check where the heading actually is first. If it is already sitting
       comfortably in view, change the content and leave the scroll position
       completely alone. Only move when the new question would otherwise be off
       screen or jammed against the very top or bottom.
       ────────────────────────────────────────────────────────────────────── */
    /* Measured against the stage, not the heading, so every state anchors to
       the same point on the page. Anchoring to the heading meant the anchor
       moved whenever a state had a different amount above it. */
    const stage = sectionRef.current?.closest('.evstage') ?? sectionRef.current
    const rect = (stage ?? heading).getBoundingClientRect()
    const viewport = window.innerHeight

    /* The comfortable band: below the top edge, and inside the upper two
       thirds. A heading in the bottom third is technically visible but the
       options underneath it would not be, which is worse than scrolling. */
    const comfortable = rect.top >= 0 && rect.top <= viewport * 0.6

    if (!comfortable) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ;(stage ?? sectionRef.current)?.scrollIntoView({
        behavior: reduced ? 'auto' : 'smooth',
        block: 'start',
      })
    }

    /* preventScroll always. Either scrollIntoView is handling movement above,
       or we deliberately decided not to move — and letting focus() scroll would
       override that decision. */
    heading.focus({ preventScroll: true })
  }, [step, blueprint])

  /* Answers that failed to save, replayed on the next successful call. Held in
     a ref rather than state because a retry must not trigger a render — the
     attendee should never see anything about syncing. */
  const unsaved = useRef<Answers>({})

  const post = useCallback(
    async (patch: Answers, complete: boolean, interestValue?: string) => {
      const payload = { ...unsaved.current, ...patch }
      try {
        const res = await fetch('/api/assessment', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            token,
            answers: payload,
            complete,
            ...(interestValue ? { interest: interestValue } : {}),
          }),
        })
        if (!res.ok) throw new Error(String(res.status))
        unsaved.current = {}
        const body = (await res.json()) as { data?: { blueprint?: BlueprintSlug } }
        return body.data?.blueprint ?? null
      } catch {
        /* Deliberately silent. The next answer carries this one with it, and if
           they finish, the final call sends everything. Nothing here is worth
           an error message at a booth. */
        unsaved.current = payload
        return null
      }
    },
    [token],
  )

  const onInterestStep = step === INTEREST_STEP
  const question = onInterestStep ? null : ASSESSMENT_QUESTIONS[step - 1]
  const onReview = step === REVIEW_STEP

  /* True while correcting a single answer from the review screen, so answering
     it returns there instead of continuing forwards. A ref because it changes
     what happens next, not what is on screen. */
  const cameFromReview = useRef(false)

  function goBack() {
    setStep((s) => Math.max(INTEREST_STEP, s - 1))
  }

  /** Jump straight to one answer from the review screen. */
  function editStep(target: number) {
    setStep(target)
  }

  /** Step one. Writes to the lead rather than the assessment row. */
  async function answerInterest(value: string) {
    setInterest(value)
    void post({}, false, value)
    /* Straight back to review if that is where they came from, so correcting
       one answer does not march them through the other six again. */
    setStep(cameFromReview.current ? REVIEW_STEP : firstQuestionStep)
    cameFromReview.current = false
  }

  async function answer(field: AssessmentField, value: string | null) {
    const patch: Answers = value ? { [field]: value } : {}
    setAnswers((a) => ({ ...a, ...patch }))

    /* Saved as they go, but never marked complete here. Completion is a
       separate, deliberate act on the review screen — see submit(). Saving
       early still means an abandoned assessment keeps whatever they gave us. */
    void post(patch, false)

    if (cameFromReview.current) {
      cameFromReview.current = false
      setStep(REVIEW_STEP)
      return
    }
    setStep((s) => s + 1)
  }

  /** The one irreversible action in the flow. */
  async function submit() {
    setBuilding(true)
    const slug = await post({}, true)
    setBuilding(false)
    /* Falls back to the foundation roadmap if the call failed. Everyone who
       reaches the end sees something — a blank screen after seven questions is
       the worst outcome available here. */
    setBlueprint(slug ?? 'foundation')
  }

  if (blueprint) {
    return (
      <BlueprintView
        slug={blueprint}
        interest={interest}
        creditRange={answers.credit_range ?? null}
        sectionRef={sectionRef}
        headingRef={headingRef}
      />
    )
  }

  /* ── REVIEW ───────────────────────────────────────────────────────────────
     Everything they told us, in one place, before anything is final.

     This exists because the last tap used to submit immediately — no pause, no
     chance to notice a mis-tap on the question that had just gone past. At a
     table with a queue that is exactly when it happens. It also means the
     record we keep is one the attendee actually looked at and agreed to, rather
     than a series of taps.

     After submitting, none of it is editable. That is enforced on the server as
     well, not just by hiding the buttons here — see /api/assessment. */
  if (onReview && !building) {
    const rows = [
      {
        step: INTEREST_STEP,
        prompt: event.choose.h2,
        answer:
          INTERESTS.find((i) => i.value === interest)?.label ??
          (interest === INTEREST_FALLBACK ? 'Not sure yet' : null),
      },
      ...ASSESSMENT_QUESTIONS.map((q, i) => ({
        step: i + 1,
        prompt: q.prompt,
        answer: labelFor(q.field, answers[q.field] ?? null),
      })),
    ]

    return (
      <section className="evas evas-review" ref={sectionRef}>
        <span className="evas-eyebrow">Last step</span>
        <h3 className="evas-q" ref={headingRef} tabIndex={-1}>
          Check your answers
        </h3>
        <p className="evas-lead">
          Tap any line to change it. Once you get your Blueprint these are
          locked in.
        </p>

        <ul className="evas-review-list">
          {rows.map((r) => (
            <li key={r.step}>
              <button
                type="button"
                className="evas-review-row"
                onClick={() => {
                  cameFromReview.current = true
                  editStep(r.step)
                }}
              >
                <span className="evas-review-q">{r.prompt}</span>
                <span className={r.answer ? 'evas-review-a' : 'evas-review-a is-empty'}>
                  {r.answer ?? 'Skipped'}
                </span>
                <span className="evas-review-edit" aria-hidden="true">
                  Change
                </span>
              </button>
            </li>
          ))}
        </ul>

        <button type="button" className="btn evgold evas-submit" onClick={() => void submit()}>
          Get my Blueprint
        </button>

        <div className="evas-nav evas-nav-single">
          <button type="button" className="evas-back" onClick={goBack}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" /></svg>
            Back
          </button>
        </div>
      </section>
    )
  }

  if (building) {
    return (
      <section className="evas evas-building" ref={sectionRef}>
        <div className="evas-spin" aria-hidden="true">
          <span /><span /><span />
        </div>
        <p className="evas-lead" role="status">
          Building your Blueprint&hellip;
        </p>
      </section>
    )
  }

  return (
    /* No aria-live on the section. It used to be here, which meant every tap
       re-announced the progress bar, the heading and all the options together.
       Moving focus to the heading announces the new question by itself, and the
       progress counter below is the only thing that needs to speak on its own. */
    <section className="evas" ref={sectionRef}>
      <ProgressBar current={step + 1} total={TOTAL_STEPS} />

      {step === firstQuestionStep && (
        <p className="evas-lead">
          Thanks{firstName ? `, ${firstName}` : ''} — you&apos;re saved. A few
          quick questions and your Blueprint is ready.
        </p>
      )}

      {/* tabIndex -1 makes it focusable programmatically without adding it to
          the tab order. This is what a screen reader reads on each step. */}
      <h3 className="evas-q" ref={headingRef} tabIndex={-1}>
        {onInterestStep ? event.choose.h2 : question!.prompt}
      </h3>

      <div className="evpicks">
        {onInterestStep
          ? INTERESTS.map((i) => (
              <button
                key={i.value}
                type="button"
                className="evpick"
                aria-pressed={interest === i.value}
                onClick={() => void answerInterest(i.value)}
              >
                <span className="dot" />
                {i.label}
              </button>
            ))
          : question!.options.map((o) => (
              <button
                key={o.value}
                type="button"
                className="evpick"
                aria-pressed={answers[question!.field] === o.value}
                onClick={() => void answer(question!.field, o.value)}
              >
                <span className="dot" />
                {o.label}
              </button>
            ))}
      </div>

      {/* Back and Skip sit together, both deliberately quiet. Neither is the
          action we want, but both need to be findable without hunting —
          someone who mis-tapped an option at a booth will otherwise just hand
          the phone back. */}
      <div className="evas-nav">
        {step > INTEREST_STEP ? (
          <button type="button" className="evas-back" onClick={goBack}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" /></svg>
            Back
          </button>
        ) : (
          <span />
        )}

        <button
          type="button"
          className="evas-skip"
          onClick={() =>
            onInterestStep
              ? void answerInterest(INTEREST_FALLBACK)
              : void answer(question!.field, null)
          }
        >
          {onInterestStep ? event.choose.skip : 'Skip this one'}
        </button>
      </div>
    </section>
  )
}

/* ── BLUEPRINT TEASER ──────────────────────────────────────────────────────
   Between the roadmap and the IdentityIQ card, per Felicia's sequence.

   Never autoplays and never preloads. At a booth, a video that starts talking
   by itself is startling in a quiet moment and inaudible in a loud one, and
   preloading spends an attendee's data on something they may not watch. They
   tap it if they want it.
   ───────────────────────────────────────────────────────────────────────── */
function Teaser() {
  const ready = !teaser.pending && teaser.src

  /* Nothing at all for attendees until there is a file. An empty frame reads as
     broken, which is worse than an absence nobody notices. */
  if (!ready) {
    if (process.env.NODE_ENV === 'production') return null
    return (
      <div className="evas-teaser">
        <div className="evas-teaser-ph" role="status">
          <b>Blueprint teaser video</b>
          <span>
            Placeholder — nothing renders here for attendees until a file exists.
            Add the URL to <code>src</code> in <code>config/teaser.ts</code> and
            set <code>pending: false</code>. An .mp4 on our own domain needs no
            other change; a Bunny embed also needs <code>frame-src</code> in{' '}
            <code>next.config.ts</code>.
          </span>
        </div>
      </div>
    )
  }

  const isFile = teaser.src.endsWith('.mp4')

  return (
    <div className="evas-teaser">
      <h4>{teaser.heading}</h4>
      <div className="evas-teaser-frame">
        {isFile ? (
          <video
            controls
            playsInline
            preload="none"
            poster={teaser.poster || undefined}
            src={teaser.src}
          />
        ) : (
          <iframe
            src={teaser.src}
            title={teaser.heading}
            loading="lazy"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        )}
      </div>
      {teaser.caption && <p className="evas-teaser-cap">{teaser.caption}</p>}
    </div>
  )
}

/* ── WHAT HAPPENS NEXT ─────────────────────────────────────────────────────
   Moved here from /thanks. The flow now ends on the Blueprint, so /thanks is
   only a fallback — which left Beast's calendar live with nothing leading to
   it. This is the route to it.

   Sits ABOVE the IdentityIQ card: booking a session is GWOP's own next step,
   the affiliate offer is secondary.

   Copy comes from event.thanks so it stays the same wording Felicia approved
   for /thanks and cannot drift between the two.
   ───────────────────────────────────────────────────────────────────────── */
function NextSteps() {
  return (
    <section className="evas-next-steps">
      <span className="evas-eyebrow">What happens next</span>
      <h4>Three things.</h4>
      <p className="evas-lead">
        In the next few minutes, and before you leave the table.
      </p>

      <ol className="evas-steps">
        {event.thanks.next.map((n, i) => (
          <li key={n.h}>
            <span className="evas-step-n">{i + 1}</span>
            <div>
              <b>{n.h}</b>
              {/* Unapproved copy stays behind the DRAFT marker, same as
                  everywhere else — the founding-member wording is still
                  pending. */}
              <p>{'pending' in n ? <Tbc>{n.p}</Tbc> : n.p}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* Hidden if the booking link is unset. A dead button at a booth is
          worse than no button. */}
      {BOOKING_URL && (
        <div className="evas-booking">
          <span className="evas-booking-eyebrow">Your next step</span>
          <h5>{event.thanks.booking.h}</h5>
          <p>{event.thanks.booking.p}</p>
          {/* New tab, deliberately. Booking inside the page would replace the
              Blueprint they just read — and at a booth, losing the thing you
              were handed is worse than an extra tab. */}
          <a
            className="btn evgold evas-booking-cta"
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {event.thanks.booking.label}
          </a>
          <span className="evas-booking-note">Opens in a new tab</span>
        </div>
      )}
    </section>
  )
}

/* ── OPTIONAL NEXT STEP ────────────────────────────────────────────────────
   Sits AFTER the Blueprint, as a visually separate card.

   Not before it and not inside it, deliberately. The Blueprint is what was
   promised free; anything between the attendee and that promise makes the free
   thing feel conditional, which is the one thing Felicia said it must not be.
   By the time this appears the promise has already been kept, so it reads as a
   suggestion rather than a toll.

   The same card shows to everyone. Surfacing it harder for people who answered
   "Don't Know" on their credit range is tempting — it is genuinely the right
   advice for them — but aiming a paid credit product at the people least sure
   of their position is exactly the thing that reads badly in hindsight.
   ───────────────────────────────────────────────────────────────────────── */
function NextStep({
  interest,
  creditRange,
}: {
  interest: string
  creditRange: string | null
}) {
  if (!identityiq.enabled) return null

  /* ── SHOWN WHEN IT FITS, NOT TO EVERYONE ────────────────────────────────
     Felicia, 2026-08-22: don't force every person into this simply because
     they finished the assessment. It should follow from their path.

     So it appears when credit is genuinely part of what they came for:
     they picked a credit or funding goal, or they told us they don't know
     their range — in which case reading the report IS the honest first move
     and this stops being an ad.

     It does NOT appear for someone focused on wealth or business who already
     knows their position. For them it is an unrelated paid product attached
     to a free gift, which is exactly the thing that erodes trust in the free
     gift. */
  const creditIsTheirTopic = interest === 'credit' || interest === 'funding'
  const doesNotKnowRange = creditRange === 'unknown' || creditRange === null
  if (!creditIsTheirTopic && !doesNotKnowRange) return null

  return (
    <aside className="evas-next" aria-labelledby="evas-next-h">
      <span className="evas-eyebrow">{identityiq.eyebrow}</span>
      <h4 id="evas-next-h">{identityiq.heading}</h4>
      <p>{identityiq.body}</p>

      {/* Cost before the disclosure, and both before the button. Someone who
          taps without reading has still walked past the price. */}
      <p className="evas-next-cost">{identityiq.cost}</p>
      <p className="evas-next-disclosure">{identityiq.disclosure}</p>

      <a
        className="btn evgold evas-next-cta"
        href={identityiq.href}
        target="_blank"
        /* sponsored: this is a paid affiliate link and search engines are
           entitled to know. noopener: never hand a third-party tab a handle on
           ours. */
        rel="sponsored noopener noreferrer"
      >
        {identityiq.cta}
      </a>

      <p className="evas-next-note">{identityiq.reassurance}</p>
    </aside>
  )
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="evas-prog">
      <div className="evas-prog-track">
        <div
          className="evas-prog-fill"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
      <span className="evas-prog-text" aria-live="polite">
        {current} of {total}
      </span>
    </div>
  )
}

/* ── THE BLUEPRINT ─────────────────────────────────────────────────────────
   Free, on screen, nothing held back. Felicia was explicit that this is not
   gated behind anything.
   ───────────────────────────────────────────────────────────────────────── */

function BlueprintView({
  slug,
  interest,
  creditRange,
  sectionRef,
  headingRef,
}: {
  slug: BlueprintSlug
  interest: string
  creditRange: string | null
  sectionRef: React.RefObject<HTMLElement | null>
  headingRef: React.RefObject<HTMLHeadingElement | null>
}) {
  const plan = blueprints[slug]

  /* Deliberately no scroll here.

     This used to call window.scrollTo({ top: 0 }), which threw the attendee to
     the very top of the page — above the hero, the gifts section and the about
     block — so the Blueprint they had just earned was several screens below
     them and they had to hunt for it. The parent now scrolls this section to
     the top of the viewport instead, which is where they actually want to be. */

  /* Same gate the consent wording uses. Unapproved copy must not reach an
     attendee, so the page says something true and useful instead of showing
     draft text with GWOP's name on it. Flip by clearing `pending` in
     content/blueprints.ts once Surpaul signs off. */
  if (!BLUEPRINTS_APPROVED || plan.pending) {
    return (
      <section className="evas evas-done" ref={sectionRef}>
        {/* Felicia §11 prescribes this exact hierarchy — "YOU'RE IN." then
            "Your GWOP Blueprint starts here." then confirm delivery. Pulled
            from content/event.ts rather than retyped, so this screen and
            /thanks can never drift apart and a reword lands in both at once.

            The delivery line is a promise Jake's automation has to keep. If his
            follow-up does not actually send a Blueprint, this sentence is the
            first thing that will be wrong at the booth. */}
        <h3 className="evas-q" ref={headingRef} tabIndex={-1}>
          {event.thanks.h1}
        </h3>
        <p className="evas-bp-h">{event.thanks.h2}</p>
        <p className="evas-lead">{event.thanks.lede}</p>

        <Teaser />
        <NextSteps />
        <NextStep interest={interest} creditRange={creditRange} />

        {/* Development only. A note to whoever is building, not to an attendee —
            it was appearing on the deployed preview where testers and the client
            could see it. Referring someone to a filename is not a user
            interface. */}
        {process.env.NODE_ENV !== 'production' && (
          <p className="evph" role="status">
            <b>Blueprint copy awaiting approval</b>
            <span>
              The roadmaps are drafted and the flow is live. They stay hidden
              until Surpaul signs the wording off, so draft copy cannot reach an
              attendee. Clear <code>pending</code> in{' '}
              <code>content/blueprints.ts</code>.
            </span>
          </p>
        )}

      </section>
    )
  }

  return (
    <section className="evas evas-bp" ref={sectionRef}>
      <span className="evas-eyebrow">Your GWOP Blueprint</span>
      <h3 className="evas-bp-h" ref={headingRef} tabIndex={-1}>
        {plan.headline}
      </h3>

      {/* Five sections, same five every time, in the same order. The
          consistency is the product: an attendee comparing notes with the
          person beside them should recognise the same shape. */}
      <div className="evas-sec">
        <h4>Where You Are</h4>
        <p>{plan.whereYouAre}</p>
      </div>

      <div className="evas-sec">
        <h4>What&apos;s Holding You Back</h4>
        <p>{plan.holdingYouBack}</p>
      </div>

      <div className="evas-sec">
        <h4>Your Next 3 Moves</h4>
        <ol className="evas-steps">
          {plan.nextMoves.map((m, i) => (
            <li key={m.title}>
              <span className="evas-step-n">{i + 1}</span>
              <div>
                <b>{m.title}</b>
                <p>{m.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* The section nobody else gives them. Telling someone what to leave
          alone is worth as much as telling them what to do, and it is what
          stops them spending money badly between now and the next step. */}
      <div className="evas-sec evas-sec-not">
        <h4>What NOT to Do Yet</h4>
        <ul className="evas-not">
          {plan.notYet.map((n) => (
            <li key={n.title}>
              <b>{n.title}</b>
              <p>{n.detail}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="evas-sec">
        <h4>Your GWOP Path</h4>
        <p>{plan.path}</p>
      </div>

      <Teaser />
      <NextSteps />
      <NextStep interest={interest} creditRange={creditRange} />
    </section>
  )
}
