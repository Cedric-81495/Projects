'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { site } from '@/content/site'
import { EVENT_PATH } from '@/config/integrations'
import { PATHWAY } from '@/content/pathway'

const LINKS = [
  { href: '/#pathway', label: 'Pathway',  meta: 'Freshman–Senior' },
  { href: '/app',      label: 'Students', meta: 'Your blueprint' },
] as const

/* ⚠️ The drawer MUST be a sibling of <header>, not a child.
   <header> uses backdrop-filter, which creates a containing block — a
   position:fixed descendant gets clipped to the header's height instead of
   filling the viewport. Keep them as siblings. */
export function SiteNav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('navopen', open)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('navopen')
    }
  }, [open])

  return (
    <>
      <header>
        <nav className="wrap nav">
          <Link className="logo" href="/" onClick={() => setOpen(false)}>
            <Image
              className="crest"
              src="/crest-200.png"
              alt=""
              width={38}
              height={38}
              priority
            />
            <b>{site.brand}<small>{site.motto}</small></b>
          </Link>

          <button
            className="burger"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="drawer"
            onClick={() => setOpen(v => !v)}
          >
            <span /><span /><span />
          </button>

          <div className="desk">
            <div className="menu">
              <a href="/#pathway">Pathway</a>
              <Link href="/app">Students</Link>
            </div>
            <Link className="btn btn-e btn-sm" href={EVENT_PATH}>{site.hero.primary}</Link>
          </div>
        </nav>
      </header>

      <div className={`drawer${open ? ' open' : ''}`} id="drawer" aria-hidden={!open}>
        <ul>
          {LINKS.map(l => (
            <li key={l.href}>
              <Link href={l.href} onClick={() => setOpen(false)}>
                {l.label}<span>{l.meta}</span>
              </Link>
            </li>
          ))}
        </ul>

        <ul className="levels">
          {PATHWAY.map(l => (
            <li key={l.slug}>
              <Link href={`/app/${l.slug}`} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="foot">
          <Link className="btn btn-g btn-full" href={EVENT_PATH} onClick={() => setOpen(false)}>
            {site.hero.primary}
          </Link>
          <p className="motto">{site.motto}</p>
        </div>
      </div>
    </>
  )
}
