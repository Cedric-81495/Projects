import { useCallback, useEffect, useState } from 'react';

/**
 * Persists non-sensitive UI state (saved apparel, dismissed notices) so a
 * visitor's favourites survive a reload before they have an account.
 *
 * Never store tokens or personal data here.
 *
 * The stored value is read *after* mount rather than in the useState
 * initializer. Two reasons: localStorage does not exist during the prerender
 * build, and even in the browser, rendering stored state on the first pass
 * would disagree with the prerendered HTML and trigger a hydration mismatch.
 *
 * The trade-off is one render with the default value. Consumers that would
 * visibly flash — a dismissed banner reappearing for a frame — should gate on
 * the returned `hydrated` flag.
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // Corrupt entry or blocked storage. The default already applies.
    }
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return; // Don't overwrite storage with the default value.
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private browsing or a full quota. State still works for this session.
    }
  }, [key, value, hydrated]);

  const reset = useCallback(() => setValue(initial), [initial]);

  return [value, setValue, reset, hydrated] as const;
}
