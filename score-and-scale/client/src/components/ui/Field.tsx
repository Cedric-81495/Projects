import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

const controlClasses =
  'w-full rounded-xl border bg-surface px-3.5 py-2.5 text-[0.9375rem] text-ink ' +
  'placeholder:text-subtle transition-[border-color,box-shadow] duration-150 ' +
  'focus:outline-none focus:ring-2 focus:ring-accent/45 focus:border-accent/50 ' +
  'disabled:cursor-not-allowed disabled:bg-raised disabled:text-subtle'

interface FieldShellProps {
  label: string
  htmlFor: string
  error?: string
  hint?: ReactNode
  required?: boolean
  children: ReactNode
}

/**
 * Shared label / hint / error scaffolding.
 *
 * The error is wired with aria-describedby and role="alert" so assistive tech
 * announces it, rather than the message being visually adjacent but
 * programmatically unconnected to the input.
 */
function FieldShell({ label, htmlFor, error, hint, required, children }: FieldShellProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && (
          <span className="ml-0.5 text-critical" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-subtle">{hint}</p>}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-xs font-medium text-critical">
          {error}
        </p>
      )}
    </div>
  )
}

type TextFieldProps = {
  label: string
  error?: string
  hint?: ReactNode
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'>

export function TextField({ label, error, hint, required, ...rest }: TextFieldProps) {
  const id = useId()

  return (
    <FieldShell label={label} htmlFor={id} error={error} hint={hint} required={required}>
      <input
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(controlClasses, error ? 'border-critical/60' : 'border-line')}
        {...rest}
      />
    </FieldShell>
  )
}

type TextAreaFieldProps = {
  label: string
  error?: string
  hint?: ReactNode
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'>

export function TextAreaField({ label, error, hint, required, rows = 5, ...rest }: TextAreaFieldProps) {
  const id = useId()

  return (
    <FieldShell label={label} htmlFor={id} error={error} hint={hint} required={required}>
      <textarea
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(controlClasses, 'resize-y', error ? 'border-critical/60' : 'border-line')}
        {...rest}
      />
    </FieldShell>
  )
}

type SelectFieldProps = {
  label: string
  error?: string
  hint?: ReactNode
  options: { value: string; label: string }[]
} & Omit<InputHTMLAttributes<HTMLSelectElement>, 'id' | 'className'>

export function SelectField({ label, error, hint, required, options, ...rest }: SelectFieldProps) {
  const id = useId()

  return (
    <FieldShell label={label} htmlFor={id} error={error} hint={hint} required={required}>
      <select
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(controlClasses, 'pr-9', error ? 'border-critical/60' : 'border-line')}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

/** Inline form-level error banner, for failures that are not field-specific. */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-critical/25 bg-critical/10 px-4 py-3 text-sm font-medium text-critical"
    >
      {children}
    </div>
  )
}

/** Inline success banner, matching FormError's weight. */
export function FormSuccess({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="rounded-xl border border-positive/25 bg-positive/10 px-4 py-3 text-sm font-medium text-positive"
    >
      {children}
    </div>
  )
}
