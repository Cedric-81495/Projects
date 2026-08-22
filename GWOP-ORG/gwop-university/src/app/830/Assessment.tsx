'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ASSESSMENT_QUESTIONS, TOTAL_STEPS, type AssessmentField } from '@/config/assessment'
import { blueprints, BLUEPRINTS_APPROVED, type BlueprintSlug } from '@/content/blueprints'
import { event } from '@/content/event'
import { INTERESTS, INTEREST_FALLBACK } from '@/config/integrations'

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
  const mounted = useRef(false)

  useEffect(() => {
    const heading = headingRef.current
    if (!heading) return

    if (!mounted.current) {
      mounted.current = true
      /* Focus without scrolling. On submit the browser is already sitting on
         the form, which is where this section is, so moving would be a jolt
         with no purpose. */
      heading.focus({ preventScroll: true })
      return
    }

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
    const rect = heading.getBoundingClientRect()
    const viewport = window.innerHeight

    /* The comfortable band: below the top edge, and inside the upper two
       thirds. A heading in the bottom third is technically visible but the
       options underneath it would not be, which is worse than scrolling. */
    const comfortable = rect.top >= 0 && rect.top <= viewport * 0.6

    if (!comfortable) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      sectionRef.current?.scrollIntoView({
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
  const isLast = step === ASSESSMENT_QUESTIONS.length

  /* Once they have seen their Blueprint, re-answering a question should take
     them straight back to it rather than marching them through the remaining
     screens again. Held in a ref: it changes what happens next but nothing on
     screen depends on it. */
  const hasCompleted = useRef(false)

  function goBack() {
    if (blueprint) {
      /* From the Blueprint, back lands on the last question rather than the
         first. Someone who wants to change an earlier answer can keep tapping,
         and someone who mis-tapped the final option — the most likely reason
         to go back at all — is exactly where they need to be. */
      setBlueprint(null)
      setStep(ASSESSMENT_QUESTIONS.length)
      return
    }
    setStep((s) => Math.max(INTEREST_STEP, s - 1))
  }

  /** Step one. Writes to the lead rather than the assessment row. */
  async function answerInterest(value: string) {
    setInterest(value)

    const complete = hasCompleted.current
    if (complete) setBuilding(true)
    const slug = await post({}, complete, value)
    if (complete) {
      setBuilding(false)
      setBlueprint(slug ?? 'foundation')
      return
    }
    setStep(firstQuestionStep)
  }

  async function answer(field: AssessmentField, value: string | null) {
    const patch: Answers = value ? { [field]: value } : {}
    setAnswers((a) => ({ ...a, ...patch }))

    /* Stays 'complete' once it has been. Someone revisiting an answer after
       finishing has not un-finished the assessment, and flipping them back to
       partial would put them in the wrong follow-up. */
    const complete = isLast || hasCompleted.current

    if (complete) {
      hasCompleted.current = true
      setBuilding(true)
      const slug = await post(patch, true)
      setBuilding(false)
      /* Falls back to the foundation roadmap if the call failed. Everyone who
         reaches the end sees something — a blank screen after seven questions
         is the worst outcome available here. */
      setBlueprint(slug ?? 'foundation')
      return
    }

    void post(patch, false)
    setStep((s) => s + 1)
  }

  if (blueprint) {
    return (
      <BlueprintView
        slug={blueprint}
        onBack={goBack}
        sectionRef={sectionRef}
        headingRef={headingRef}
      />
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
  onBack,
  sectionRef,
  headingRef,
}: {
  slug: BlueprintSlug
  onBack: () => void
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

        <button type="button" className="evas-back" onClick={onBack}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" /></svg>
          Change an answer
        </button>
      </section>
    )
  }

  return (
    <section className="evas evas-bp" ref={sectionRef}>
      <span className="evas-eyebrow">Your Blueprint</span>
      <h3 className="evas-bp-h" ref={headingRef} tabIndex={-1}>
        {plan.headline}
      </h3>
      <p className="evas-lead">{plan.intro}</p>

      <ol className="evas-steps">
        {plan.steps.map((s, i) => (
          <li key={s.title}>
            <span className="evas-step-n">{i + 1}</span>
            <div>
              <b>{s.title}</b>
              <p>{s.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="evas-close">{plan.closing}</p>

      {/* Quiet, below the roadmap. Someone who realises they mis-tapped a
          question should not have to start the whole thing again. */}
      <button type="button" className="evas-back" onClick={onBack}>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" /></svg>
        Change an answer
      </button>

      {/* CTA slot. Empty by design.

          IdentityIQ is proposed but the flow around it is not settled — the
          3:01am message describes a version with no assessment and calls this
          page a teaser, which contradicts the brief this was built from.
          Wiring is twenty minutes once confirmed.

          Whatever lands here: the disclosure goes directly above the button,
          not in a footer, and the price is stated. IdentityIQ has no free tier
          and no trial. Someone handed something free by people they trust will
          tap a button assuming the next thing is free too. */}
    </section>
  )
}
