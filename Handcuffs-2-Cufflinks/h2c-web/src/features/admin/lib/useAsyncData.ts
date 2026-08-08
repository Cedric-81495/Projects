import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api/client';

export interface AsyncState<T> {
  data: T | null;
  /** True only on the first load, so a refresh does not blank the screen. */
  loading: boolean;
  error: string | null;
  /** Set when the API could not be reached at all, rather than refusing. */
  offline: boolean;
  reload: () => void;
}

/**
 * One fetch, with the three states every CMS screen has to handle.
 *
 * The distinction between "the API said no" and "the API was not there" is kept
 * because they need different words: a permissions problem is the operator's to
 * solve, an unreachable backend is not, and telling someone to check their
 * access when the server is simply down wastes their afternoon.
 *
 * Results from a superseded request are discarded rather than rendered — typing
 * in a search box fires several, and they do not come back in order.
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [nonce, setNonce] = useState(0);

  const requestId = useRef(0);
  const hasLoaded = useRef(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const id = ++requestId.current;
    let settled = false;

    setError(null);
    setOffline(false);
    // Only the very first load shows a loading state; later ones keep the
    // previous rows on screen so the table does not flash empty on every keystroke.
    if (!hasLoaded.current) setLoading(true);

    void (async () => {
      try {
        const result = await fetcherRef.current();
        if (id !== requestId.current) return;
        settled = true;
        setData(result);
      } catch (caught) {
        if (id !== requestId.current) return;
        settled = true;
        if (caught instanceof ApiError && caught.status === 0) {
          setOffline(true);
          setError('Could not reach the API. Check that the backend is running.');
        } else {
          setError(caught instanceof Error ? caught.message : 'Something went wrong.');
        }
      } finally {
        if (id === requestId.current && settled) {
          hasLoaded.current = true;
          setLoading(false);
        }
      }
    })();

    return () => {
      // Leaves requestId ahead of this request, which is what discards its result.
      requestId.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { data, loading, error, offline, reload };
}

/** Turns any thrown value into something worth showing an operator. */
export function messageFor(caught: unknown): string {
  if (caught instanceof ApiError) {
    if (caught.status === 0) return 'Could not reach the API. Check that the backend is running.';
    if (caught.fieldErrors) {
      const first = Object.entries(caught.fieldErrors)[0];
      if (first) return `${caught.message} (${first[0]}: ${first[1].join(', ')})`;
    }
    return caught.message;
  }
  return caught instanceof Error ? caught.message : 'Something went wrong.';
}

/** Field-level errors from the API, keyed the way the form addresses its inputs. */
export function fieldErrorsFor(caught: unknown): Record<string, string[]> {
  return caught instanceof ApiError && caught.fieldErrors ? caught.fieldErrors : {};
}
