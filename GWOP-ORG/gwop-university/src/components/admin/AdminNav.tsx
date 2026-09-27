'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/* The one client component in /admin. A server component cannot read the
   current path, and highlighting the active section is the whole job.

   ⚠ EXACT MATCH ON '/admin', PREFIX MATCH ON THE REST. startsWith('/admin')
   is true for every route in here, so the dashboard would stay lit on every
   page. The sections have no children of their own yet; when one grows a
   detail route, prefix matching is what keeps the parent highlighted. */
const SECTIONS: { label: string; items: { href: string; label: string }[] }[] = [
  {
    label: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard' }],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/curriculum', label: 'Curriculum' },
      { href: '/admin/pdfs', label: 'Course PDFs' },
      { href: '/admin/downloads', label: 'Downloads' },
    ],
  },
]

export default function AdminNav() {
  const path = usePathname()
  const isActive = (href: string) =>
    href === '/admin' ? path === '/admin' : path.startsWith(href)

  return (
    <nav className="anav">
      {SECTIONS.map(s => (
        <div className="anav-group" key={s.label}>
          <p className="anav-label">{s.label}</p>
          {s.items.map(i => (
            <Link
              key={i.href}
              href={i.href}
              className={`anav-link${isActive(i.href) ? ' is-on' : ''}`}
            >
              {i.label}
            </Link>
          ))}
        </div>
      ))}
      <div className="anav-group">
        <p className="anav-label">Student side</p>
        <Link href="/app" className="anav-link">View the portal ›</Link>
      </div>
    </nav>
  )
}
