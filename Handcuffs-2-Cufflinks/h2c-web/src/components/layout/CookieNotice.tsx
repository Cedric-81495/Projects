import { Link } from 'react-router-dom';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/router/routes';
import { cn } from '@/lib/utils/cn';

/**
 * Cookie consent. Declining is as easy as accepting — a single dismissable
 * banner with two equal-weight choices, no dark patterns.
 */
export function CookieNotice() {
  const [choice, setChoice, , hydrated] = useLocalStorage<'accepted' | 'declined' | null>(
    'h2c.cookies',
    null
  );

  // Same reasoning as the announcement bar: no flash for visitors who chose.
  if (!hydrated) return null;

  return (
    <div className={cn('cookie', choice !== null && 'is-off')} role="region" aria-label="Cookie notice">
      <p>
        We use a small number of cookies to understand which stories reach people. Nothing is sold
        or shared. Read the <Link to={`${ROUTES.legal}/cookies`}>Cookie Notice</Link>.
      </p>
      <div className="row">
        <Button variant="gold" size="sm" onClick={() => setChoice('accepted')}>
          Accept
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setChoice('declined')}>
          Decline
        </Button>
      </div>
    </div>
  );
}
