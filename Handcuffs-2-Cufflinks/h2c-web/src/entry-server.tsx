import { prerender } from 'react-dom/static';
import { StaticRouter } from 'react-router';
import { AuthProvider } from '@/providers/AuthProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { MemberProvider } from '@/providers/MemberProvider';
import { EngagementProvider } from '@/providers/EngagementProvider';
import { AppRoutes } from '@/router/AppRoutes';
import { HeadCollectorContext } from '@/lib/seo/head';
import type { HeadCollector, HeadTags } from '@/lib/seo/head';

export interface RenderResult {
  html: string;
  head: HeadTags | null;
}

async function streamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let out = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  return out + decoder.decode();
}

/**
 * Renders one route to static HTML for the prerender build.
 *
 * Uses react-dom/static's prerender rather than renderToString: the route tree
 * is code-split with React.lazy, and renderToString would emit the Suspense
 * fallback instead of the page — producing prerendered files with no content
 * and no metadata, which defeats the point.
 *
 * The markup is a snapshot for crawlers and first paint only. The client
 * hydrates and refetches, so a VA's edit appears without a rebuild.
 */
export async function render(url: string): Promise<RenderResult> {
  const collector: HeadCollector = { current: null };

  const { prelude } = await prerender(
    <HeadCollectorContext.Provider value={collector}>
      <AuthProvider>
        <ToastProvider>
          <MemberProvider>
            <EngagementProvider>
              <StaticRouter location={url}>
                <AppRoutes />
              </StaticRouter>
            </EngagementProvider>
          </MemberProvider>
        </ToastProvider>
      </AuthProvider>
    </HeadCollectorContext.Provider>
  );

  return { html: await streamToString(prelude), head: collector.current };
}

/** Re-exported so the prerender script has a single entry point to import. */
export { PRERENDER_ROUTES, DYNAMIC_ROUTE_SOURCES } from '@/router/manifest';
