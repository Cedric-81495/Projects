import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '@/components/Header';
import { AnnouncementBar, Footer } from '@/components/Footer';
import {
  Veil,
  MobileNav,
  SearchOverlay,
  CookieBar,
  BackToTop,
  Toast,
} from '@/components/Overlays';

export function RootLayout() {
  const { pathname } = useLocation();

  // Reset scroll when the route (not the hash) changes.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <>
      <AnnouncementBar />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />

      {/* Chrome overlays */}
      <Veil />
      <MobileNav />
      <SearchOverlay />
      <CookieBar />
      <BackToTop />
      <Toast />
    </>
  );
}
