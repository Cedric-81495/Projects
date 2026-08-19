import { PortalLoading } from '@/components/portal/PortalLoading'

/**
 * Suspense fallback for the (portal) group — currently /dashboard.
 *
 * Same component as /app/loading.tsx on purpose: a student moving between the
 * dashboard and a level should not see two different loading treatments, which
 * reads as two different apps.
 */
export default function Loading() {
  return <PortalLoading />
}