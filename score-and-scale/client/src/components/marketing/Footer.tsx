import { Link } from 'react-router-dom'
import { SectionLink } from '../ui/SectionLink'
import { Logo } from './Logo'

const SECTIONS = [
  { section: 'how-it-works', label: 'How it works' },
  { section: 'programs', label: 'Programs' },
  { section: 'results', label: 'Results' },
  { section: 'faq', label: 'FAQ' },
] as const

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-line bg-canvas">
      <div className="container-page py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Credit strategy and funding preparation for founders who are done being declined.
            </p>
          </div>

          <nav aria-label="Product">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">
              Product
            </h2>
            <ul className="mt-4 space-y-2.5">
              {SECTIONS.map((item) => (
                <li key={item.section}>
                  {/*
                    Same route-aware link as the header, so footer navigation
                    works identically from a nested route.
                  */}
                  <SectionLink
                    section={item.section}
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {item.label}
                  </SectionLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Account">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">
              Account
            </h2>
            <ul className="mt-4 space-y-2.5">
              {[
                { to: '/login', label: 'Sign in' },
                { to: '/register', label: 'Create account' },
                { to: '/dashboard', label: 'Dashboard' },
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">
              Company
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-muted transition-colors hover:text-ink"
                >
                  Contact
                </Link>
              </li>
              <li>
                <a
                  href="mailto:hello@scoreandscale.com"
                  className="text-sm text-muted transition-colors hover:text-ink"
                >
                  hello@scoreandscale.com
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-subtle">
            © {year} Score and Scale. All rights reserved.
          </p>
          <p className="max-w-xl text-xs leading-relaxed text-subtle">
            Score and Scale provides credit education and funding preparation services. We are not a
            lender, and we do not guarantee any specific score increase or funding outcome.
          </p>
        </div>
      </div>
    </footer>
  )
}
