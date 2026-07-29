import { API_URL } from '../../lib/api'

interface GoogleButtonProps {
  /** Copy differs between sign-in and sign-up; the flow behind it is identical. */
  mode: 'signin' | 'signup'
  /** Same-site path to land on after authentication, e.g. /checkout?program=scale. */
  next?: string | null
}

/**
 * Entry point for Google authentication.
 *
 * Deliberately a plain anchor rather than a fetch: the authorization-code flow
 * is a full-page redirect to Google and back to our own callback, and an XHR
 * cannot follow a cross-origin navigation. That also means no Google SDK is
 * loaded and no client id is present in this bundle.
 *
 * `target` is left as the current tab on purpose — opening the OAuth flow in a
 * new tab strands the session cookies in a window the user then closes.
 */
export function GoogleButton({ mode, next }: GoogleButtonProps) {
  const query = next ? `?next=${encodeURIComponent(next)}` : ''
  const href = `${API_URL}/api/auth/google${query}`

  return (
    <a
      href={href}
      className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border
        border-line bg-surface px-5 text-sm font-semibold text-ink shadow-soft
        transition-[background-color,border-color,transform] duration-200
        hover:border-ink/20 hover:bg-raised active:translate-y-px"
    >
      {/* Google's mark, inlined so it needs no network request and cannot be blocked. */}
      <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62Z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A9 9 0 0 0 9 18Z"
        />
        <path
          fill="#FBBC05"
          d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.34Z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
        />
      </svg>
      {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
    </a>
  )
}

/** Horizontal rule with a centred label, separating OAuth from the password form. */
export function AuthDivider({ label = 'or' }: { label?: string }) {
  return (
    <div className="relative my-6" aria-hidden="true">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-line" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-surface px-3 text-xs font-medium uppercase tracking-[0.1em] text-subtle">
          {label}
        </span>
      </div>
    </div>
  )
}
