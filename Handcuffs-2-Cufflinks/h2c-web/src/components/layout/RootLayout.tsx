import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { CookieNotice } from './CookieNotice';
import { ScrollToTop } from './ScrollToTop';
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
      <ScrollToTop />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <SavedDrawer />
      <CookieNotice />
    </>
  );
}
