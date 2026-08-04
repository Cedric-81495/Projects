import { useEffect } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export function RootLayout() {
  const { pathname } = useLocation();
  // Ensure top-of-page on navigation (belt-and-suspenders with ScrollRestoration)
  useEffect(() => window.scrollTo(0, 0), [pathname]);

  return (
    <div className="flex min-h-full flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </div>
  );
}
