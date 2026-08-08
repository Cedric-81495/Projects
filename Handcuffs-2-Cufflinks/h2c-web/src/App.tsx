import { AuthProvider } from '@/providers/AuthProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { MemberProvider } from '@/providers/MemberProvider';
import { EngagementProvider } from '@/providers/EngagementProvider';
import { AppRouter } from '@/router';

/**
 * Provider order matters. ToastProvider wraps EngagementProvider because
 * engagement raises toasts, and MemberProvider wraps it too so engagement can
 * hydrate from the signed-in member's server-side record.
 *
 * AuthProvider (staff) and MemberProvider (public) are siblings by design and
 * share nothing.
 */
export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MemberProvider>
          <EngagementProvider>
            <AppRouter />
          </EngagementProvider>
        </MemberProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
