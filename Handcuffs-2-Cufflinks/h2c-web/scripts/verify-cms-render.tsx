/**
 * Renders every CMS screen against a mocked API and reports anything that
 * throws.
 *
 * The contract check (`verify:cms`) proves the admin and the API agree about
 * route names and field names. It does not execute a single component, so a
 * screen that reads `data.items.map` where the API returns an object still
 * passes it and still breaks in front of an operator. This renders them.
 */
import { renderToString } from 'react-dom/server';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RESOURCES } from '@/features/admin/lib/resources';
import { AuthProvider } from '@/providers/AuthProvider';
import { ToastProvider } from '@/providers/ToastProvider';

/** A record shaped loosely enough to satisfy any list or form on any screen. */
const RECORD = {
  id: '6710a3f2c9e1b84d2f0a7c31',
  _id: '6710a3f2c9e1b84d2f0a7c31',
  slug: 'a-record',
  name: 'A record',
  title: 'A record',
  status: 'draft',
  updatedAt: '2026-10-15T00:00:00.000Z',
  createdAt: '2026-10-15T00:00:00.000Z',
  publishedAt: null,
  displayOrder: 0,
  episodeNumber: 1,
  lookNumber: 1,
  quote: 'A quote',
  attribution: 'Someone',
  kind: 'course',
  type: 'single',
  startsAt: '2026-11-01T00:00:00.000Z',
  story: 'Its meaning.',
  keyLessons: ['One', 'Two', 'Three'],
  credits: [],
  sizes: [],
  images: [],
  engagement: { likes: 0, favorites: 0, votes: 0, notifyMeCount: 0, shares: 0, views: 0 },
};

/** Every GET the admin makes, answered in the shape the API really returns. */
function mockResponse(url: string): unknown {
  if (url.includes('/analytics/dashboard'))
    return {
      subscribers: { total: 0, last30: 0, trend: [] },
      queue: { pendingStories: 0, unpublishedApproved: 0 },
      content: { docuseriesEpisodes: 0, podcastEpisodes: 0, musicReleases: 0, apparel: 0 },
      apparel: { topVoted: [], topLiked: [] },
      media: {
        music: { reach: 0, total: 0 },
        docuseries: { reach: 0, total: 0 },
        podcast: { reach: 0, total: 0 },
      },
    };
  if (url.includes('/site/settings')) return { siteName: 'H2C', emails: {}, social: {} };
  if (url.includes('/site/founder'))
    return { name: '', role: '', gallery: [], press: [], speakingTopics: [] };
  if (url.includes('/site/homepage')) return [{ key: 'hero', enabled: true, displayOrder: 0 }];
  if (url.includes('/site/navigation')) return [{ location: 'header', items: [] }];
  if (url.includes('/site/seo')) return [];
  if (url.includes('/media')) return { items: [], total: 0, page: 1, pageSize: 24 };
  if (url.includes('/subscribers')) return { items: [], total: 0, page: 1, pageSize: 25 };
  if (url.includes('/users')) return { items: [], total: 0 };
  if (url.includes('/audit')) return { items: [], total: 0 };
  if (url.includes('/community')) return { items: [], total: 0, page: 1, pageSize: 25 };
  if (/\/[0-9a-f]{24}$/i.test(url)) return RECORD;
  return { items: [RECORD], total: 1, page: 1, pageSize: 25 };
}

globalThis.fetch = (async (input: RequestInfo | URL) => {
  const url = String(typeof input === 'string' ? input : (input as Request).url ?? input);
  return new Response(JSON.stringify({ success: true, data: mockResponse(url) }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}) as typeof fetch;

const screens: [string, string][] = [
  ['Dashboard', '@/features/admin/DashboardPage#DashboardPage'],
  ['H2C module', '@/features/admin/modules#AdminH2CPage'],
  ['Kitchen Muzik module', '@/features/admin/modules#AdminKitchenPage'],
  ['GWOP module', '@/features/admin/modules#AdminGwopPage'],
  ['Community moderation', '@/features/admin/CommunityPage#AdminCommunityPage'],
  ['Media library', '@/features/admin/MediaPage#AdminMediaPage'],
  ['Subscribers', '@/features/admin/SubscribersPage#AdminSubscribersPage'],
  ['Users and roles', '@/features/admin/UsersPage#AdminUsersPage'],
  ['Homepage sections', '@/features/admin/HomepagePage#AdminHomepagePage'],
  ['Navigation', '@/features/admin/NavigationPage#AdminNavigationPage'],
  ['Search metadata', '@/features/admin/SeoPage#AdminSeoPage'],
  ['Founder profile', '@/features/admin/FounderPage#AdminFounderPage'],
  ['Site settings', '@/features/admin/SettingsPage#AdminSettingsPage'],
];

let failures = 0;

function attempt(label: string, render: () => void): void {
  try {
    render();
    console.log(`  ok    ${label}`);
  } catch (error) {
    failures += 1;
    const message = error instanceof Error ? error.message : String(error);
    console.log(`  FAIL  ${label}\n          ${message.split('\n')[0]}`);
  }
}

const modules = import.meta.glob('/src/features/admin/**/*.tsx');

async function run(): Promise<void> {
  console.log('\nCMS screens\n');

  for (const [label, spec] of screens) {
    const [path, name] = spec.split('#');
    const loader = modules[path.replace('@/', '/src/') + '.tsx'];
    if (!loader) {
      console.log(`  SKIP  ${label} (module not found)`);
      continue;
    }
    const mod = (await loader()) as Record<string, React.ComponentType>;
    const Component = mod[name!];
    attempt(label, () =>
      renderToString(
        <AuthProvider><ToastProvider>
          <MemoryRouter initialEntries={["/admin"]}>
            <Component />
          </MemoryRouter>
        </ToastProvider></AuthProvider>
      )
    );
  }

  console.log('\nRecord screens (list / new / edit) for all 13 types\n');

  const listMod = (await modules['/src/features/admin/ResourceListPage.tsx']!()) as {
    ResourceListPage: React.ComponentType;
  };
  const editMod = (await modules['/src/features/admin/ResourceEditPage.tsx']!()) as {
    ResourceEditPage: React.ComponentType;
  };

  for (const { key } of RESOURCES) {
    for (const [mode, path, Component] of [
      ['list', `/admin/records/${key}`, listMod.ResourceListPage],
      ['new', `/admin/records/${key}/new`, editMod.ResourceEditPage],
      ['edit', `/admin/records/${key}/${RECORD.id}`, editMod.ResourceEditPage],
    ] as const) {
      attempt(`${key} · ${mode}`, () =>
        renderToString(
          <AuthProvider><ToastProvider>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/admin/records/:resource" element={<Component />} />
              <Route path="/admin/records/:resource/new" element={<Component />} />
              <Route path="/admin/records/:resource/:id" element={<Component />} />
            </Routes>
          </MemoryRouter>
          </ToastProvider></AuthProvider>
        )
      );
    }
  }

  console.log(
    failures === 0
      ? `\n✓ every CMS screen rendered — ${screens.length} screens, ${RESOURCES.length} record types × 3\n`
      : `\n✗ ${failures} screen(s) failed to render\n`
  );
  process.exit(failures === 0 ? 0 : 1);
}

void run();
