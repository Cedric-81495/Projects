import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { primaryLinks } from '@/data/nav';
import { cn } from '@/lib/cn';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-500 ease-ease',
        scrolled || open
          ? 'border-b border-faint/30 bg-ink/85 backdrop-blur-xl'
          : 'border-b border-transparent',
      )}
    >
      <Container className="flex h-16 items-center justify-between sm:h-20">
        <Logo />

        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {primaryLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'link-underline text-sm text-bone/75 transition-colors hover:text-bone',
                  isActive && 'text-bone',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ButtonLink to="/join" size="md" variant="gold" className="hidden sm:inline-flex">
            Join the movement
          </ButtonLink>
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid h-11 w-11 place-items-center rounded-full border border-faint/40 text-bone lg:hidden"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </Container>

      {/* Mobile drawer */}
      <div
        className={cn(
          'overflow-hidden border-t border-faint/20 bg-ink/95 backdrop-blur-xl transition-[max-height] duration-500 ease-ease lg:hidden',
          open ? 'max-h-[32rem]' : 'max-h-0',
        )}
      >
        <Container className="flex flex-col gap-1 py-4">
          {primaryLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg px-3 py-3 text-base text-bone/85 hover:bg-raise"
            >
              {item.label}
            </Link>
          ))}
          <ButtonLink to="/join" className="mt-3" variant="gold">
            Join the movement
          </ButtonLink>
        </Container>
      </div>
    </header>
  );
}
