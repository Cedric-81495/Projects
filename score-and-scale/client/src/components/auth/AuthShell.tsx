import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FadeUp } from '../ui/FadeUp'
import { Logo } from '../marketing/Logo'

/**
 * Shared frame for the sign-in and registration pages.
 *
 * Keeps both screens visually identical, so the only difference a user perceives
 * is the form itself. Exists to prevent the two pages drifting apart as either
 * one is edited.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden py-16">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="grid-backdrop absolute inset-x-0 top-0 h-96" />
        <div className="absolute left-1/2 top-[-10rem] h-80 w-[36rem] -translate-x-1/2 rounded-full bg-accent/[0.06] blur-3xl" />
      </div>

      <div className="container-page">
        <FadeUp>
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex justify-center">
              <Link to="/" aria-label="Score and Scale — home">
                <Logo />
              </Link>
            </div>

            <div className="rounded-card border border-line bg-surface p-7 shadow-lifted sm:p-9">
              <h1 className="text-display-sm font-semibold text-ink">{title}</h1>
              <p className="mt-2 text-sm text-muted">{subtitle}</p>

              <div className="mt-7">{children}</div>
            </div>

            {footer && <p className="mt-6 text-center text-sm text-muted">{footer}</p>}
          </div>
        </FadeUp>
      </div>
    </div>
  )
}
