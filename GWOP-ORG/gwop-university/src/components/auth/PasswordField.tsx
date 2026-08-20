'use client'

import { useId, useState } from 'react'

/**
 * Password input with a show/hide toggle.
 *
 * Typing a 10-character minimum into a field you cannot read is the single
 * biggest cause of failed sign-ins, and on a phone keyboard it is worse — a
 * mistyped character is invisible and the only feedback is a rejected login.
 *
 * The toggle is a real <button type="button">. Not a span with an onClick: it
 * has to be reachable by keyboard and announced, and inside a <form> a button
 * without an explicit type defaults to submit, which would post the form every
 * time someone tried to peek at their password.
 *
 * `aria-pressed` communicates the state rather than the label alone, so a screen
 * reader user knows whether the value is currently exposed.
 */
export function PasswordField({
  name,
  label,
  autoComplete,
  minLength,
  required,
  hint,
}: {
  name: string
  label: string
  autoComplete: 'current-password' | 'new-password'
  minLength?: number
  required?: boolean
  /** Rendered under the field, e.g. the 10-character rule. */
  hint?: string
}) {
  const [shown, setShown] = useState(false)
  const id = useId()

  /* Mirrors the existing `.aufield` markup rather than introducing a second
     field pattern, so spacing and label styling stay identical to the email
     fields sitting above it. */
  return (
    <label className="aufield" htmlFor={id}>
      <span>{label}</span>
      <div className="pwwrap">
        <input
          id={id}
          name={name}
          type={shown ? 'text' : 'password'}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
        />
        <button
          type="button"
          className="pwtoggle"
          onClick={() => setShown(v => !v)}
          aria-pressed={shown}
          /* The visible label already reads Show/Hide, but it does not say what
             it acts on. With two password fields on the reset form, "Hide" alone
             is ambiguous. */
          aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          /* Keeps the toggle out of the tab order between the field and the
             submit button. Someone tabbing through the form wants to reach
             Submit next, not a visibility control. Still reachable by
             shift-tabbing back, and by any pointer. */
          tabIndex={-1}
        >
          {shown ? 'Hide' : 'Show'}
        </button>
      </div>
      {hint && <small>{hint}</small>}
    </label>
  )
}
