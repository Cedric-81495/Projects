import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { TransformationMark } from '@/components/brand/TransformationMark';
import { navGroups, socials } from '@/data/nav';
import { subscribeNewsletter } from '@/services/forms';
import { useSubmit } from '@/hooks/useSubmit';

export function Footer() {
  const [email, setEmail] = useState('');
  const { submit, isSubmitting, isSuccess, error } = useSubmit(subscribeNewsletter);
  const done = isSuccess;

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    const ok = await submit({ email: email.trim(), source: 'footer' });
    if (ok) setEmail('');
  }

  return (
    <footer className="relative overflow-hidden border-t border-faint/30 bg-onyx">
      <Container className="py-20">
        <div className="grid gap-14 lg:grid-cols-[1.2fr_1fr]">
          {/* Newsletter */}
          <div>
            <TransformationMark className="h-16 w-56" animate={false} />
            <h2 className="mt-8 max-w-md text-balance font-display text-3xl font-semibold text-bone">
              Get the next chapter first.
            </h2>
            <p className="mt-3 max-w-sm text-pretty text-muted">
              New stories, episodes, and drops&mdash;sent when they land, never more.
            </p>

            {done ? (
              <p className="mt-6 font-mono text-sm text-green-bright" role="status">
                You&rsquo;re in. Watch your inbox.
              </p>
            ) : (
              <form onSubmit={subscribe} className="mt-6 max-w-md">
                <div className="flex gap-2">
                  <label htmlFor="footer-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="footer-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    disabled={isSubmitting}
                    className="h-12 flex-1 rounded-full border border-faint/50 bg-ink px-5 text-sm text-bone placeholder:text-faint focus:border-gold disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe"
                    disabled={isSubmitting}
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold-sheen text-ink transition hover:brightness-110 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <ArrowRight size={18} />
                    )}
                  </button>
                </div>
                {error && (
                  <p className="mt-3 text-sm text-red-400" role="alert">
                    {error}
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Nav */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {navGroups.map((group) => (
              <nav key={group.label} aria-label={group.label}>
                <h3 className="font-mono text-[0.65rem] uppercase tracking-eyebrow text-gold">
                  {group.label}
                </h3>
                <ul className="mt-4 space-y-3">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <Link to={item.to} className="text-sm text-muted transition hover:text-bone">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
            <nav aria-label="Connect">
              <h3 className="font-mono text-[0.65rem] uppercase tracking-eyebrow text-gold">
                Connect
              </h3>
              <ul className="mt-4 space-y-3">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.to}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-muted transition hover:text-bone"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-faint/25 pt-8 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Handcuffs 2 Cufflinks. Wear your story.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-muted">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-muted">
              Terms
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
