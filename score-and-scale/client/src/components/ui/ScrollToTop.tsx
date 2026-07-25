import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Router preserves scroll position across route changes by default.
 * This forces every navigation to start at the top of the new page.
 * Render once, near the root, inside <BrowserRouter>.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}
