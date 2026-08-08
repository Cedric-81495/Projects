import { useEffect, useMemo, useRef, useState } from 'react';
import { apiGet } from '@/lib/api/client';

/**
 * Reads published content from the API, with the seeded copy as a safety net.
 *
 * Every public section used to render from a constant compiled into the bundle,
 * which meant nothing a VA published ever reached the site. This hook is the
 * replacement, and it keeps the seed for one specific job: rendering something
 * true to the brand when the API cannot answer.
 *
 * That matters more here than on most sites. The API sleeps on lower hosting
 * tiers and can take the better part of a minute to wake, and the guide is
 * explicit that the site exists to tell the story — a visitor who arrives
 * during a cold start should read about the movement, not look at an error.
 *
 * The fallback also covers an empty result, not just a failure. A fresh
 * database returns zero episodes quite legitimately, and an empty docuseries
 * page reads as broken rather than as new. Pass `strict` once real content is
 * in place and an empty list genuinely means "nothing to show".
 */

export interface ContentState<T> {
  items: readonly T[];
  /** True until the first response, so a section can show a spinner. */
  loading: boolean;
  /** False when the seed is being shown — useful in development. */
  live: boolean;
}

interface Options {
  /** Query parameters, e.g. `{ featured: 'true', pageSize: 3 }`. */
  params?: Record<string, unknown>;
  /** Show an empty list rather than the seed when the API returns nothing. */
  strict?: boolean;
}

interface Paged<T> {
  items: T[];
}

function unwrap<T>(payload: Paged<T> | T[]): T[] {
  return Array.isArray(payload) ? payload : (payload?.items ?? []);
}

export function useContent<TApi, TView>(
  path: string,
  map: (item: TApi) => TView,
  fallback: readonly TView[],
  options: Options = {}
): ContentState<TView> {
  const [state, setState] = useState<ContentState<TView>>({
    items: fallback,
    loading: true,
    live: false,
  });

  // Options are usually written inline at the call site, so a new object
  // arrives on every render. Comparing the serialised form keeps that from
  // restarting the request forever.
  const key = JSON.stringify(options.params ?? {});
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        const payload = await apiGet<Paged<TApi> | TApi[]>(
          path,
          JSON.parse(key) as Record<string, unknown>,
          controller.signal
        );
        if (cancelled) return;

        const mapped = unwrap(payload).map((item) => mapRef.current(item));
        const empty = mapped.length === 0;

        setState({
          items: empty && !options.strict ? fallback : mapped,
          loading: false,
          live: !empty,
        });
      } catch {
        // Deliberately quiet. A failed content read is not something a visitor
        // can act on, and the section still renders — from the seed.
        if (!cancelled) setState({ items: fallback, loading: false, live: false });
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // `fallback` is a module constant at every call site and is intentionally
    // not a dependency: including it would re-run on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key, options.strict]);

  return state;
}

/**
 * The same read, for a section that shows one record — a featured episode, the
 * latest release. Returns the first item rather than making the caller index
 * into a list and handle the empty case itself.
 */
export function useFeatured<TApi, TView>(
  path: string,
  map: (item: TApi) => TView,
  fallback: TView,
  params?: Record<string, unknown>
): { item: TView; loading: boolean; live: boolean } {
  const seed = useMemo(() => [fallback], [fallback]);
  const state = useContent<TApi, TView>(path, map, seed, {
    params: { pageSize: 1, ...params },
  });

  return { item: state.items[0] ?? fallback, loading: state.loading, live: state.live };
}
