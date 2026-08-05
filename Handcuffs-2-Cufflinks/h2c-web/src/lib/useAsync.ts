import { useCallback, useEffect, useRef, useState } from 'react';
import type { AsyncStatus } from '@/types';

interface AsyncResult<T> {
  status: AsyncStatus;
  data: T | null;
  error: Error | null;
  reload: () => void;
}

/** True when a payload should be treated as "no content". */
function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

/**
 * Runs an async loader and reports a five-state lifecycle:
 * idle → loading → ready | empty | error.
 *
 * Consumers pair this with <AsyncContent> so every data-driven
 * surface renders a skeleton, an empty state, or an error state —
 * and never a blank or half-broken section.
 *
 * `deps` re-run the loader (e.g. a changed filter or route param).
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncResult<T> {
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);
  const alive = useRef(true);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    alive.current = true;
    setStatus('loading');
    setError(null);

    loader()
      .then((result) => {
        if (!alive.current) return;
        setData(result);
        setStatus(isEmpty(result) ? 'empty' : 'ready');
      })
      .catch((err: unknown) => {
        if (!alive.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus('error');
      });

    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { status, data, error, reload };
}
