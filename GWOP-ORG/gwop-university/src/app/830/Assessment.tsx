'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ASSESSMENT_QUESTIONS, TOTAL_STEPS, type AssessmentField } from '@/config/assessment'
import { blueprints, BLUEPRINTS_APPROVED, type BlueprintSlug } from '@/content/blueprints'

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
}

type Answers = Partial<Record<AssessmentField, string>>

export function Assessment({ token, firstName }: Props) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [blueprint, setBlueprint] = useState<BlueprintSlug | null>(null)

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
  /* Skips the very first render. On submit the browser is already sitting on
     the form, which is where this section is — scrolling then would be a jolt
     with no purpose. */
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      /* Focus without scrolling, so the first question is announced but the
         view stays where the attendee left it. */
      headingRef.current?.focus({ preventScroll: true })
      return
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    sectionRef.current?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    })
    /* preventScroll, because scrollIntoView above is already doing it. Letting
       focus() scroll as well produces a visible double-jump on iOS. */
    headingRef.current?.focus({ preventScroll: true })
  }, [step, blueprint])

  /* Answers that failed to save, replayed on the next successful call. Held in
     a ref rather than state because a retry must not trigger a render — the
     attendee should never see anything about syncing. */
  const unsaved = useRef<Answers>({})

  const post = useCallback(
    async (patch: Answers, complete: boolean) => {
      const payload = { ...unsaved.current, ...patch }
      try {
        const res = await fetch('/api/assessment', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token, answers: payload, complete }),
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

  const question = ASSESSMENT_QUESTIONS[step]
  const isLast = step === ASSESSMENT_QUESTIONS.length - 1

  async function answer(field: AssessmentField, value: string | null) {
    const patch: Answers = value ? { [field]: value } : {}
    setAnswers((a) => ({ ...a, ...patch }))

    if (isLast) {
      const slug = await post(patch, true)
      /* Falls back to the foundation roadmap if the final call failed. Everyone
         who reaches the end sees something — a blank screen after seven
         questions is the worst outcome available here. */
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
        firstName={firstName}
        sectionRef={sectionRef}
        headingRef={headingRef}
      />
    )
  }

  return (
    /* No aria-live on the section. It used to be here, which meant every tap
       re-announced the progress bar, the heading and all the options together.
       Moving focus to the heading announces the new question by itself, and the
       progress counter below is the only thing that needs to speak on its own. */
    <section className="evas" ref={sectionRef}>
      <ProgressBar current={step + 2} total={TOTAL_STEPS} />

      {step === 0 && (
        <p className="evas-lead">
          Thanks{firstName ? `, ${firstName}` : ''} — you&apos;re saved. Six quick
          questions and your Blueprint is ready.
        </p>
      )}

      {/* tabIndex -1 makes it focusable programmatically without adding it to
          the tab order. This is what a screen reader reads on each step. */}
      <h3 className="evas-q" ref={headingRef} tabIndex={-1}>
        {question.prompt}
      </h3>

      <div className="evpicks">
        {question.options.map((o) => (
          <button
            key={o.value}
            type="button"
            className="evpick"
            aria-pressed={answers[question.field] === o.value}
            onClick={() => void answer(question.field, o.value)}
          >
            <span className="dot" />
            {o.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="evas-skip"
        onClick={() => void answer(question.field, null)}
      >
        Skip this one
      </button>
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
  firstName,
  sectionRef,
  headingRef,
}: {
  slug: BlueprintSlug
  firstName: string
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
        <h3 className="evas-q" ref={headingRef} tabIndex={-1}>
          You&apos;re all set{firstName ? `, ${firstName}` : ''}
        </h3>
        <p className="evas-lead">
          Your answers are saved. Your Blueprint is on its way to your phone
          shortly — a member of the team can talk you through it here in the
          meantime.
        </p>
        <p className="evph" role="status">
          <b>Blueprint copy awaiting approval</b>
          <span>
            The roadmaps are drafted and the flow is live. They stay hidden until
            Surpaul signs the wording off, so draft copy cannot reach an attendee.
            Clear <code>pending</code> in <code>content/blueprints.ts</code>.
          </span>
        </p>
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
