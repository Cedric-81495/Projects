import { useState, type FormEvent } from 'react'
import { ApiError, apiFetch } from '../lib/api'
import { Button } from '../components/ui/Button'
import { FadeUp } from '../components/ui/FadeUp'
import {
  FormError,
  FormSuccess,
  SelectField,
  TextAreaField,
  TextField,
} from '../components/ui/Field'

const TOPICS = [
  { value: 'general', label: 'General enquiry' },
  { value: 'funding', label: 'Funding readiness' },
  { value: 'credit', label: 'Credit profile' },
  { value: 'partnership', label: 'Partnerships' },
  { value: 'support', label: 'Existing member support' },
]

interface FieldErrors {
  name?: string
  email?: string
  message?: string
}

export function Contact() {
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setFieldErrors({})

    const form = new FormData(event.currentTarget)

    try {
      await apiFetch('/api/contact', {
        method: 'POST',
        body: {
          name: String(form.get('name') ?? ''),
          email: String(form.get('email') ?? ''),
          phone: String(form.get('phone') ?? ''),
          topic: String(form.get('topic') ?? 'general'),
          message: String(form.get('message') ?? ''),
          // Honeypot — a real user never sees or fills this.
          company: String(form.get('company') ?? ''),
        },
      })

      setSent(true)
    } catch (error) {
      if (error instanceof ApiError) {
        /**
         * Field-level messages from the server's Zod validation are mapped back
         * onto their inputs, so the user sees the problem next to the field
         * rather than a generic banner.
         */
        if (error.code === 'VALIDATION_ERROR' && error.details) {
          const mapped: FieldErrors = {}
          for (const detail of error.details) {
            if (detail.field === 'name' || detail.field === 'email' || detail.field === 'message') {
              mapped[detail.field] = detail.message
            }
          }
          setFieldErrors(mapped)
          setFormError(Object.keys(mapped).length > 0 ? null : error.message)
        } else {
          setFormError(error.message)
        }
      } else {
        setFormError('We could not send your message. Please check your connection and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="py-section">
      <div className="container-page">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <FadeUp>
            <div>
              <p className="eyebrow">Contact</p>
              <h1 className="mt-3 text-display-lg font-semibold text-ink">
                Tell us where you are stuck.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-muted">
                A real advisor reads every message and replies within one business day. No call
                centre, no sales script.
              </p>

              <dl className="mt-10 space-y-6 border-t border-line pt-8">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">
                    Email
                  </dt>
                  <dd className="mt-1.5">
                    <a
                      href="mailto:hello@scoreandscale.com"
                      className="text-[0.9375rem] font-medium text-ink underline-offset-4 hover:underline"
                    >
                      hello@scoreandscale.com
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">
                    Response time
                  </dt>
                  <dd className="mt-1.5 text-[0.9375rem] text-muted">
                    Within one business day, Monday to Friday
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">
                    Already a member?
                  </dt>
                  <dd className="mt-1.5 text-[0.9375rem] text-muted">
                    Message your advisor from your dashboard for a faster reply.
                  </dd>
                </div>
              </dl>
            </div>
          </FadeUp>

          <FadeUp delay={90}>
            <div className="rounded-card border border-line bg-surface p-7 shadow-soft sm:p-9">
              {sent ? (
                <div className="py-6">
                  <FormSuccess>
                    Thanks — your message is with our team. We will reply within one business day.
                  </FormSuccess>
                  <Button
                    variant="secondary"
                    size="md"
                    className="mt-6"
                    onClick={() => setSent(false)}
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate className="space-y-5">
                  {formError && <FormError>{formError}</FormError>}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                      label="Your name"
                      name="name"
                      autoComplete="name"
                      required
                      error={fieldErrors.name}
                      placeholder="Jordan Whitfield"
                    />
                    <TextField
                      label="Email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      error={fieldErrors.email}
                      placeholder="you@company.com"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextField
                      label="Phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="Optional"
                    />
                    <SelectField label="What is this about?" name="topic" options={TOPICS} />
                  </div>

                  <TextAreaField
                    label="How can we help?"
                    name="message"
                    required
                    rows={6}
                    error={fieldErrors.message}
                    placeholder="Tell us about your situation — where you are now and what you are trying to fund."
                    hint="The more context you give, the more useful our first reply will be."
                  />

                  {/*
                    Honeypot field. Hidden from sight and from assistive tech,
                    and excluded from the tab order, so only an automated filler
                    will populate it.
                  */}
                  <div className="absolute h-0 w-0 overflow-hidden" aria-hidden="true">
                    <label htmlFor="company">Company</label>
                    <input id="company" name="company" tabIndex={-1} autoComplete="off" />
                  </div>

                  <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
                    {submitting ? 'Sending…' : 'Send message'}
                  </Button>

                  <p className="text-center text-xs text-subtle">
                    We only use your details to reply. No lists, no sharing.
                  </p>
                </form>
              )}
            </div>
          </FadeUp>
        </div>
      </div>
    </div>
  )
}
