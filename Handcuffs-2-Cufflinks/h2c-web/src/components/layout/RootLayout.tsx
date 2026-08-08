import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { CookieNotice } from './CookieNotice';
import { RouteScrollReset } from './RouteScrollReset';
import { BackToTop } from './BackToTop';
import { SavedDrawer } from '@/features/collections/components/SavedDrawer';
import { useReveal } from '@/hooks/useReveal';

/**
 * The public site shell. Reveal observation is re-run per route so sections
 * mounted by a new page animate in rather than sitting at zero opacity.
 */
export function RootLayout() {
  const { pathname } = useLocation();
  useReveal(pathname);

  return (
    <>
      <RouteScrollReset />
      <Header />
      {/* tabIndex -1 makes <main> a valid focus target. Both the skip link and
          the back-to-top button move focus here; without it the browser scrolls
          but leaves focus behind on the control. */}
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <SavedDrawer />
      <BackToTop />
      <CookieNotice />
    </>
  );
}
