import { Link } from 'react-router-dom';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Icon } from '@/components/ui/Icon';
import { ROUTES } from '@/router/routes';

/**
 * Emerald announcement bar above the header. Content is CMS-managed; the
 * dismissal is remembered so it does not nag on every visit.
 */
export function Announcement() {
  const [dismissed, setDismissed, , hydrated] = useLocalStorage(
    'h2c.announcement.dismissed',
    false
  );

  // Wait for the stored choice before rendering, or a visitor who already
  // dismissed this would see it flash back on every page load.
  if (!hydrated || dismissed) return null;

  return (
    <div className="anno">
      <span>
        Season one of the docuseries is out.{' '}
        <Link to={ROUTES.docuseries}>Watch the stories</Link>
      </span>
      <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss announcement">
        <Icon name="close" />
      </button>
    </div>
  );
}
