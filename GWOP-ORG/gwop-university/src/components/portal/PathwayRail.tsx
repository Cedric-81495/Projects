'use client'

import Link from 'next/link'
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

  return (
    <nav className="porail" aria-label="Student">
      {/* The scroller is the overflow container; the hairline lives on the inner
          track so it spans the full rail rather than the visible window. */}
      <div className="porail-scroll">
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
                  <span
                    className="porail-item is-locked"
                    aria-disabled="true"
                    title={`${l.label} — unlocks with enrollment`}
                  >
                    <span className="porail-mark" aria-hidden="true">{NUMERAL[i]}</span>
                    <span className="porail-label">{l.label}</span>
                  </span>
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
