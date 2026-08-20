'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { isStaff, canAccessLevel, LEVELS, type AccessState } from '@/lib/access/policy'

/* Roman numerals, matching the matriculation years a real university uses and
   the classical architecture in the crest. Four fixed levels, so a lookup beats
   a conversion function. */
const NUMERAL = ['I', 'II', 'III', 'IV'] as const

/**
 * THE PATHWAY RAIL — the portal's signature element.
 *
 * The previous nav was six plain links in a wrapping flex row. At ~1300px
 * "Senior" fell to a second line and "Sign out" broke across two; at ~500px the
 * whole bar rearranged itself. It also treated the pathway as a list of pages
 * when it is actually an ordered progression with cumulative access.
 *
 * So the rail encodes the thing that is true about the content: I → II → III →
 * IV, sitting on one continuous hairline, with the current stop marked by a gold
 * underline that replaces its segment of that line. Numbering is justified here
 * because the order carries real information — a student cannot open Junior
 * without passing through Sophomore.
 *
 * Client component only because active state needs `usePathname`. It is kept
 * separate from PortalChrome so the shell, the account block and the footer stay
 * server-rendered and this is the only JavaScript the portal ships.
 *
 * Lock state comes from `canAccessLevel`, never an inline `level <=
 * enrolledLevel`. policy.ts is explicit: once that comparison is copied into a
 * component, changing the rule means auditing the whole tree.
 */
export function PathwayRail({ access }: { access: AccessState }) {
  const pathname = usePathname()
  const scroller = useRef<HTMLDivElement>(null)

  /* Bring the current stop into view.
     This is what makes horizontal scrolling honest rather than a trap. Without
     it, a student on Senior opens the page to a rail showing Dashboard and
     Freshman, with no indication that their own level is off to the right —
     the navigation would be hiding the one item they care about.

     `inline: 'center'` rather than 'nearest' so the neighbours on both sides
     stay partly visible, which is what tells someone the rail scrolls at all.

     Runs on pathname change, so moving between levels keeps the rail oriented.
     `behavior: 'auto'` on first paint would be a visible jump, but the rail is
     short and the alternative — animating on every navigation — is worse. */
  useEffect(() => {
    const el = scroller.current?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!el) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [pathname])

  return (
    <nav className="porail" aria-label="Student">
      {/* The scroller is the overflow container; the hairline lives on the inner
          track so it spans the full rail rather than the visible window. */}
      <div className="porail-scroll" ref={scroller}>
        <ul className="porail-track">
          <li>
            <Link
              href="/dashboard"
              className="porail-item"
              aria-current={pathname === '/dashboard' ? 'page' : undefined}
            >
              <span className="porail-mark" aria-hidden="true">◆</span>
              <span className="porail-label">Dashboard</span>
            </Link>
          </li>

          {LEVELS.map((l, i) => {
            const href = `/app/${l.slug}`
            const open = canAccessLevel(access, l.level)
            /* startsWith, so a module page keeps its level marked as current. */
            const current = pathname.startsWith(href)

            /* A locked level stays visible and dimmed. Package p.3 asks the
               university to "visually show progression", and a student cannot
               want what they cannot see — hiding Junior makes the product look
               like it ends at Sophomore. */
            return (
              <li key={l.slug}>
                {open ? (
                  <Link
                    href={href}
                    className="porail-item"
                    aria-current={current ? 'page' : undefined}
                  >
                    <span className="porail-mark" aria-hidden="true">{NUMERAL[i]}</span>
                    <span className="porail-label">{l.label}</span>
                  </Link>
                ) : (
                  /* A locked level is a LINK to /membership, not a dead span.
                     It was inert with a `title` tooltip, which meant a phone
                     user — most of them — got a greyed-out word and no
                     explanation at all. Dimmed and unclickable reads as broken
                     rather than locked; the first reaction to it here was "is
                     this a bug?", from the person who built it.

                     Sending it to /membership also matches what the dashboard
                     card already does with its "Unlock" button, so the same
                     level behaves the same way in both places. */
                  <Link
                    href="/membership"
                    className="porail-item is-locked"
                    aria-label={`${l.label} — locked. See membership options`}
                  >
                    <span className="porail-mark" aria-hidden="true">{NUMERAL[i]}</span>
                    <span className="porail-label">{l.label}</span>
                    {/* A visible padlock, because the tooltip that used to carry
                        this meaning never appeared on touch. */}
                    <svg className="porail-lock" viewBox="0 0 24 24" width="11" height="11"
                         aria-hidden="true">
                      <path d="M7 10V7a5 5 0 0 1 10 0v3" fill="none"
                            stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                      <rect x="4" y="10" width="16" height="11" rx="2.2"
                            fill="currentColor" />
                    </svg>
                  </Link>
                )}
              </li>
            )
          })}

          {/* Only HIDES the link — /admin is guarded server-side and by RLS
              whatever is rendered here. */}
          {isStaff(access) && (
            <li className="porail-staff">
              <Link
                href="/admin"
                className="porail-item"
                aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
              >
                <span className="porail-mark" aria-hidden="true">◆</span>
                <span className="porail-label">Admin</span>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  )
}
