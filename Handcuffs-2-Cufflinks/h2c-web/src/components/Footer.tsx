import { useState } from 'react';
import { Link } from 'react-router-dom';
import { footerNav } from '@/shared/nav';
import { cn } from '@/lib/cn';

export function AnnouncementBar() {
  const [show, setShow] = useState(true);
  const dismiss = () => {
    document.documentElement.dataset.noanno = '1';
    setShow(false);
  };
  if (!show) return null;
  return (
    <div className="anno">
      <span>New arc dropping soon — <Link to="/join">join the list</Link> for first access.</span>
      <button aria-label="Dismiss announcement" onClick={dismiss}>×</button>
    </div>
  );
}

const socials = [
  { label: 'Instagram', d: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm5-1h.01' },
  { label: 'YouTube', d: 'M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8Zm7 1v6l5-3-5-3Z' },
  { label: 'TikTok', d: 'M14 4v9a4 4 0 1 1-4-4M14 4a5 5 0 0 0 5 5' },
  { label: 'Spotify', d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm-4 12c3-1 6-.7 8 .6M7.5 11c4-1 7.5-.4 10 1.2M7 8c4.5-1 9 0 11 1.5' },
];

export function Footer() {
  return (
    <>
      <div className="arc-shift" aria-hidden="true" />
      <footer className="ftr">
        <div className="wrap">
          <div className="ftr-top">
            <div>
             <Link to="/" className="ftr-logo" aria-label="Handcuffs 2 Cufflinks, home">
                <img
                  className="w-36 sm:w-44 md:w-56 h-auto"
                  src="/assets/logo.png"
                  width={900}
                  height={529}
                  loading="lazy"
                  decoding="async"
                  alt="Handcuffs 2 Cufflinks"
                />
              </Link>
              <p className="ftr-mission">
                A global movement built for people who refused to remain trapped by their
                past. From struggle to success. Faith. Family. Freedom. Legacy in motion.
              </p>
              <div className="social">
                {socials.map((s) => (
                  <a key={s.label} href="#" aria-label={s.label}>
                    <svg viewBox="0 0 24 24"><path d={s.d} /></svg>
                  </a>
                ))}
              </div>
            </div>
            {footerNav.map((col) => (
              <div key={col.heading}>
                <h6>{col.heading}</h6>
                <ul>
                  {col.items.map((it) => (
                    <li key={it.to + it.label}>
                      <Link to={it.to}>{it.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="ftr-bot">
            <span>© {new Date().getFullYear()} Handcuffs 2 Cufflinks · Boston, Massachusetts</span>
            <Link to="/legal" className={cn()}>Terms</Link>
            <Link to="/legal">Privacy</Link>
            <Link to="/legal">Returns</Link>
            <span className="push">Built on purpose. Driven by legacy.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
