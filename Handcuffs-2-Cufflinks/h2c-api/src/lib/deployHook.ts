import { env } from '@/config/env';
import { logger } from '@/lib/logger';

/**
 * Asks Vercel to rebuild the site.
 *
 * The frontend prerenders each route for social unfurling, and that metadata
 * only refreshes on a build. Content itself is live for visitors immediately
 * via the runtime API fetch, so this is never on the critical path — a failure
 * costs a stale social preview until the next build, nothing more.
 *
 * Debounced: a VA publishing six episodes in a row should cause one build.
 */
let pending: NodeJS.Timeout | null = null;
let queued = 0;

export function requestSiteRebuild(reason: string): void {
  if (!env.deployHookUrl) return;

  queued += 1;
  if (pending) clearTimeout(pending);

  pending = setTimeout(() => {
    const count = queued;
    pending = null;
    queued = 0;

    void fetch(env.deployHookUrl!, { method: 'POST' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        logger.info({ reason, changes: count }, 'site rebuild requested');
      })
      .catch((error: unknown) => {
        logger.warn({ error, reason }, 'rebuild hook failed; metadata refreshes on the next build');
      });
  }, env.DEPLOY_HOOK_DEBOUNCE_MS);

  // Never hold the process open just for a pending rebuild.
  pending.unref?.();
}

/** Flush on shutdown so a queued rebuild is not lost on deploy. */
export function flushRebuild(): void {
  if (!pending || !env.deployHookUrl) return;
  clearTimeout(pending);
  pending = null;
  queued = 0;
  void fetch(env.deployHookUrl, { method: 'POST' }).catch(() => {});
}
