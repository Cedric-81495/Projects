import type { Metadata } from 'next';
import Link from 'next/link';
import { BackToTop } from '@/components/ui/back-to-top';
import './globals.css';

export const metadata: Metadata = {
  title: 'JobFinder — search jobs from multiple sources in one place',
  description:
    'A free job aggregator. JobFinder collects publicly available listings from permitted job sources and links you to the original posting.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <header className="border-b border-line bg-paper-raised">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-base font-semibold tracking-tight text-ink no-underline">
              Job<span className="text-moss">Finder</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/jobs" className="text-ink-muted no-underline hover:text-ink">Browse jobs</Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>

        <BackToTop />

        <footer className="border-t border-line">
          <div className="mx-auto max-w-5xl px-4 py-6 text-xs leading-relaxed text-ink-muted">
            JobFinder links to listings on the sites that published them. Job content belongs to
            those sites and the employers who posted it. Every result carries its source, and
            every apply button opens the original posting.
          </div>
        </footer>
      </body>
    </html>
  );
}
