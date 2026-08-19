import { PortalLoading } from '@/components/portal/PortalLoading'

/**
 * Suspense fallback for every route under /app.
 *
 * Next renders this in place of the page while the segment's server work runs.
 * Because the guard and the two Supabase calls live in this folder's layout.tsx,
 * the shell — brand bar, pathway nav, sign-out — is already on screen by the
 * time this shows, so the attendee sees a page loading rather than a blank tab.
 */
export default function Loading() {
  return <PortalLoading />
}