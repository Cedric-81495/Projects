import { AuthProvider } from '@/providers/AuthProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { EngagementProvider } from '@/providers/EngagementProvider';
import { AppRouter } from '@/router';

/**
 * Provider order matters: engagement raises toasts, so ToastProvider has to be
 * the outer of the two.
 */
export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <EngagementProvider>
          <AppRouter />
        </EngagementProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
