import { useCallback, useState } from 'react';
import { ApiError } from '@/services/apiClient';

type Status = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Wraps an async submit action with UI state: status + error message.
 * Prevents double-submits while in flight.
 */
export function useSubmit<TArgs extends unknown[]>(action: (...args: TArgs) => Promise<unknown>) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (...args: TArgs): Promise<boolean> => {
      setStatus('submitting');
      setError(null);
      try {
        await action(...args);
        setStatus('success');
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : 'Something went wrong. Please try again.';
        setError(message);
        setStatus('error');
        return false;
      }
    },
    [action],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return {
    submit,
    reset,
    status,
    error,
    isSubmitting: status === 'submitting',
    isSuccess: status === 'success',
  };
}
