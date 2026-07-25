import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SectionLink } from '../ui/SectionLink';

export function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-ink/90 backdrop-blur-md border-b border-line">
      <div className="flex items-center justify-between px-8 py-5 max-w-[1180px] mx-auto">
        <Link to="/" className="flex items-center gap-2.5 font-display text-xl font-bold text-offwhite">
          <span className="w-[30px] h-[30px] border border-brass rounded-full flex items-center justify-center font-mono text-xs text-brass">
            S&amp;S
          </span>
          Score &amp; Scale
        </Link>
        <nav className="hidden md:flex gap-8 text-sm text-paper2">
          <SectionLink to="#process" className="hover:text-brassBright">Process</SectionLink>
          <SectionLink to="#programs" className="hover:text-brassBright">Programs</SectionLink>
          <SectionLink to="#faq" className="hover:text-brassBright">FAQ</SectionLink>
          <Link to="/contact" className="hover:text-brassBright">Contact</Link>
        </nav>

        {/* Avoid a flash of the wrong CTA while /api/auth/me resolves */}
        {!loading && (
          <>
            {!user && (
              <SectionLink
                to="#programs"
                className="border border-brass px-5 py-2 text-xs uppercase tracking-wide rounded-sm hover:bg-brass hover:text-ink transition-colors"
              >
                Get Started
              </SectionLink>
            )}
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="border border-brass px-5 py-2 text-xs uppercase tracking-wide rounded-sm hover:bg-brass hover:text-ink transition-colors"
              >
                Dashboard
              </Link>
            )}
            {user && user.role !== 'admin' && (
              <Link
                to="/dashboard"
                className="border border-brass px-5 py-2 text-xs uppercase tracking-wide rounded-sm hover:bg-brass hover:text-ink transition-colors"
              >
                Profile
              </Link>
            )}
          </>
        )}
      </div>
    </header>
  );
}
