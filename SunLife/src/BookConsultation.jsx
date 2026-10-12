import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Header } from './Header.jsx'
import { Footer } from './Footer.jsx'

// ---------------------------------------------------------------
// Systeme.io integration
// ---------------------------------------------------------------
// Replace this with the real endpoint once it's available:
//   - If using a Systeme.io "Form" element on a funnel page, open the
//     form's embed/share settings and copy its POST action URL here.
//   - If using Systeme.io's API instead, point this at your own
//     backend/serverless function (don't call a secret-keyed API
//     directly from the browser), and have that function forward
//     the lead to Systeme.io.
// Until this is set, submissions are only logged to the browser
// console so the flow can be tested end-to-end.
const SYSTEME_IO_FORM_ACTION = '[SYSTEME.IO FORM ACTION URL PLACEHOLDER]'

const TRUST_POINTS = [
  "Forty-five minutes, start to finish — I won't run over.",
  'Never any pressure to buy.',
  'Clear, everyday language — happy to repeat anything.',
  'Everything you tell me stays private.',
]

const QUESTIONS = [
  {
    key: 'reason',
    prompt: 'What brings you here today?',
    options: [
      "Protect my family's income if something happens to me.",
      'Protect myself against a serious illness or hospitalisation.',
      'Build savings or an investment toward a goal I can name.',
      'I already have coverage and want it reviewed.',
      'Something else. I am asking about employment, loans, or a business partnership.',
    ],
  },
  {
    key: 'who_for',
    prompt: 'Who are we planning for?',
    options: [
      'Myself.',
      'Myself and my spouse or children.',
      'My parents or someone else who depends on me.',
      'I am working abroad and planning for my family back home.',
    ],
  },
  {
    key: 'timing',
    prompt: 'How soon would you want a plan in place?',
    options: [
      'Right away, within the next week or two.',
      'Within the month.',
      'In the next two to three months.',
      'I am reading up for now, with no particular date in mind.',
    ],
  },
  {
    key: 'budget',
    prompt: 'What could you comfortably set aside each month?',
    options: [
      'Under ₱2,000 a month. I would like to start small.',
      '₱2,000 to ₱4,000 a month.',
      '₱4,001 to ₱7,000 a month.',
      '₱7,001 and up a month.',
      'Nothing at all right now.',
    ],
  },
  {
    key: 'walkthrough',
    prompt: 'Would you like someone to walk you through it before you decide?',
    options: [
      'Yes. I want it explained plainly, then time to think.',
      'No. I only want brochures or a price list to read on my own.',
    ],
  },
  {
    key: 'health',
    prompt: 'To the best of your knowledge, how is your health?',
    options: [
      'Generally healthy.',
      'Some manageable conditions, such as hypertension or diabetes.',
      'Severe or chronic conditions.',
      'I would rather talk about this privately.',
    ],
  },
]

const TOTAL_STEPS = QUESTIONS.length + 1 // + the contact-details step

export function BookConsultation() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [contact, setContact] = useState({ fullName: '', mobile: '', email: '' })
  const [status, setStatus] = useState('form') // 'form' | 'submitting' | 'done' | 'error'

  const isContactStep = step === QUESTIONS.length

  function selectOption(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('submitting')

    const payload = {
      name: contact.fullName,
      email: contact.email,
      phone: contact.mobile,
      ...answers,
    }

    const isPlaceholder = SYSTEME_IO_FORM_ACTION.startsWith('[')

    if (isPlaceholder) {
      // No endpoint configured yet — log so the flow is testable locally.
      console.log('[BookConsultation] Lead captured (Systeme.io not yet connected):', payload)
      setStatus('done')
      return
    }

    try {
      await fetch(SYSTEME_IO_FORM_ACTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setStatus('done')
    } catch (err) {
      console.error('[BookConsultation] Submission failed:', err)
      setStatus('error')
    }
  }

  return (
    <>
      <div className="page is-revealed">
        <div className="top-ribbon" aria-hidden="true" />
        <Header />

        <section className="section consult-hero">
          <div className="consult-hero-copy">
            <h1 className="consult-title">Let's see if this is a good use of your time</h1>
            <p className="consult-sub">
              Just a few quick questions to start. If it looks like a good fit, I'll share my
              details so we can talk. If it's not, I'll tell you plainly — and point you toward
              something more useful instead.
            </p>
            <ul className="consult-trust-list">
              {TRUST_POINTS.map((point) => (
                <li key={point}>
                  <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <p className="consult-skip">
              Would you rather skip the form and just talk? That is completely fine.{' '}
              <a href="tel:[PHONE PLACEHOLDER]">Call or text [Phone Placeholder]</a>
            </p>
          </div>
        </section>

        <section className="section consult-form-section">
          <div className="consult-card">
            {status === 'done' ? (
              <ConsultSuccess />
            ) : (
              <>
                <div className="consult-progress" aria-hidden="true">
                  <div
                    className="consult-progress-bar"
                    style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
                  />
                </div>
                <p className="consult-step-count">
                  Step {step + 1} of {TOTAL_STEPS}
                </p>

                {!isContactStep ? (
                  <QuestionStep
                    question={QUESTIONS[step]}
                    selected={answers[QUESTIONS[step].key]}
                    onSelect={(value) => selectOption(QUESTIONS[step].key, value)}
                  />
                ) : (
                  <ContactStep
                    contact={contact}
                    setContact={setContact}
                    onSubmit={handleSubmit}
                    submitting={status === 'submitting'}
                    error={status === 'error'}
                  />
                )}

                {step > 0 && (
                  <button type="button" className="consult-back" onClick={goBack}>
                    ← Back
                  </button>
                )}
              </>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}

function QuestionStep({ question, selected, onSelect }) {
  return (
    <div className="consult-step">
      <h2 className="consult-question">{question.prompt}</h2>
      <div className="consult-options">
        {question.options.map((option) => (
          <button
            type="button"
            key={option}
            className={`consult-option${selected === option ? ' is-selected' : ''}`}
            onClick={() => onSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function ContactStep({ contact, setContact, onSubmit, submitting, error }) {
  return (
    <form className="consult-step consult-contact-form" onSubmit={onSubmit}>
      <h2 className="consult-question">Where should I reach you?</h2>
      <p className="consult-contact-note">
        I reply personally, usually within a day. Whatever you share stays between us.
      </p>

      <label className="consult-field">
        <span>Full name</span>
        <input
          type="text"
          required
          value={contact.fullName}
          onChange={(e) => setContact((c) => ({ ...c, fullName: e.target.value }))}
        />
      </label>

      <label className="consult-field">
        <span>Mobile number</span>
        <input
          type="tel"
          required
          value={contact.mobile}
          onChange={(e) => setContact((c) => ({ ...c, mobile: e.target.value }))}
        />
      </label>

      <label className="consult-field">
        <span>Email address</span>
        <input
          type="email"
          required
          value={contact.email}
          onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
        />
      </label>

      <button type="submit" className="btn btn-primary consult-submit" disabled={submitting}>
        {submitting ? 'Sending…' : 'See if we are a fit'}
      </button>
      <p className="consult-submit-note">Free, unhurried, and never a hard sell.</p>

      {error && (
        <p className="consult-error">
          Something went wrong sending that. Please try again, or{' '}
          <a href="tel:[PHONE PLACEHOLDER]">call or text [Phone Placeholder]</a> instead.
        </p>
      )}
    </form>
  )
}

function ConsultSuccess() {
  return (
    <div className="consult-step consult-success">
      <CheckCircle2 size={40} strokeWidth={1.75} aria-hidden="true" />
      <h2 className="consult-question">Thank you — that's everything I need.</h2>
      <p>
        I'll review what you shared and reach out within a day to find a time that works for
        you. No pressure, no obligation — just an honest look at whether this is worth your
        time.
      </p>
    </div>
  )
}
