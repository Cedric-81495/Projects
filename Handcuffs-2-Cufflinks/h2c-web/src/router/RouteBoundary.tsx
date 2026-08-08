import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

/**
 * Recovers from a failed route chunk.
 *
 * Every page is a dynamic import, and the built filenames carry a content hash.
 * When a new version is deployed while someone has the site open, their tab is
 * still holding the old filenames — so the next client-side navigation asks for
 * a chunk that no longer exists, the import rejects, and Suspense waits for a
 * promise that will never resolve. The visitor sees an empty page, and a hard
 * refresh "fixes" it, because a refresh fetches the new HTML with the new
 * filenames.
 *
 * That is a deploy artefact, not something a visitor can understand or act on,
 * so it is handled rather than reported: reload once, silently, and land them
 * on the page they asked for.
 *
 * The reload is guarded by a session flag. If the chunk is missing for some
 * other reason — a bad cache, a broken CDN object — reloading again would loop
 * forever, so the second failure shows a plain message instead.
 */

const RELOAD_FLAG = 'h2c.chunk-reload';
/**
 * How recently a recovery reload counts as "we already tried this".
 *
 * The flag cannot simply be cleared when the boundary mounts: the boundary
 * mounts on every page load, including the one the reload just produced, which
 * would clear the guard before the chunk had a chance to fail again and put the
 * page into a reload loop. A timestamp avoids that without needing to know when
 * a route has "really" succeeded — a failure within the window means the reload
 * did not help, and anything later is a fresh problem worth one more try.
 */
const RELOAD_WINDOW_MS = 30_000;

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/** True for the various ways a browser reports a dynamic import that 404'd. */
function isChunkError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(
    message
  );
}

export class RouteBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (isChunkError(error) && !this.reloadedRecently()) {
      sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
      window.location.reload();
      return;
    }

    // Anything else is a real bug. It is logged rather than swallowed so it
    // shows up in the browser console during development and in whatever
    // error reporting is added later.
    console.error('Route failed to render', error, info.componentStack);
  }

  private reloadedRecently(): boolean {
    try {
      const stamp = Number(sessionStorage.getItem(RELOAD_FLAG) ?? 0);
      return stamp > 0 && Date.now() - stamp < RELOAD_WINDOW_MS;
    } catch {
      // Private browsing modes can throw on storage access. Without a guard the
      // safe choice is not to reload, since a loop is worse than a message.
      return true;
    }
  }

  render(): ReactNode {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="routefail" role="alert">
        <p className="h-xs">This page did not load</p>
        <p className="body body--quiet">
          The site was probably updated while you had it open. Reloading will fix it.
        </p>
        <button type="button" className="btn btn--gold" onClick={() => window.location.reload()}>
          Reload the page
        </button>
      </div>
    );
  }
}
