import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Resets scroll on navigation, but leaves in-page anchors alone so links to a
 * section on the current page still work.
 *
 * Renders nothing — this is behaviour, not chrome. The visible return-to-top
 * control is `BackToTop`, which is a separate concern: it is user-triggered,
 * animates, and manages focus.
 */
export function RouteScrollReset() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}
