import { Link } from 'react-router-dom';
import { Seo } from '@/lib/seo/Seo';
import { apiGet } from '@/lib/api/client';
import { useAuth } from '@/providers/context/auth';
import { ROUTES, buildPath } from '@/router/routes';
import type { Paginated } from '@/types/common';
import { AdminHeader, Note, Skeleton } from './components/Chrome';
import { Glyph } from './components/Glyph';
import type { GlyphName } from './components/Glyph';
import { resourcesInGroup } from './lib/resources';
import type { ResourceDef, ResourceGroup } from './lib/resources';
import { useAsyncData } from './lib/useAsyncData';

/** A tile that is not a record list — settings, moderation, and so on. */
export interface ModuleLink {
  to: string;
  label: string;
  blurb: string;
  glyph: GlyphName;
}

export interface ModuleSection {
  name: string;
  groups?: ResourceGroup[];
  links?: ModuleLink[];
}

const RESOURCE_GLYPH: Record<string, GlyphName> = {
  collections: 'shirt',
  apparel: 'shirt',
  looks: 'image',
  docuseries: 'film',
  'podcast-episodes': 'mic',
  'podcast-clips': 'mic',
  announcements: 'sparkle',
  'hero-banners': 'layout',
  pages: 'panel',
  artists: 'user',
  releases: 'note',
  programmes: 'graduation',
  events: 'inbox',
};

/**
 * A module's front door.
 *
 * Tiles carry a live count because the first question anyone opening a module
 * asks is "how much is in here" — and a count of zero on a module that should
 * hold twelve records is the fastest way to notice the API is not connected.
 */
export function ModuleIndexPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: ModuleSection[];
}) {
  const { hasPermission } = useAuth();

  const visibleIn = (group: ResourceGroup) =>
    resourcesInGroup(group).filter(
      (resource) => hasPermission(resource.writePermission) || hasPermission('content:read')
    );

  const all = sections.flatMap((section) => (section.groups ?? []).flatMap(visibleIn));

  const counts = useAsyncData<Record<string, number | null>>(async () => {
    const results = await Promise.allSettled(
      all.map((resource) => apiGet<Paginated<unknown>>(`${resource.basePath}/admin/all`, { pageSize: 1 }))
    );
    return Object.fromEntries(
      all.map((resource, index) => {
        const result = results[index];
        return [resource.key, result.status === 'fulfilled' ? result.value.total : null];
      })
    );
    // Keyed on the resource set, which is stable for a given module and role.
  }, [all.map((resource) => resource.key).join(',')]);

  return (
    <>
      <Seo title={title} description={intro} noIndex />
      <AdminHeader eyebrow={eyebrow} title={title} intro={intro} />

      {counts.offline && (
        <Note title="API unreachable" tone="bad">
          Record counts and every screen below need the backend running.
        </Note>
      )}

      {sections.map((section) => {
        const resources = (section.groups ?? []).flatMap(visibleIn);
        if (resources.length === 0 && !section.links?.length) return null;

        return (
          <section key={section.name} style={{ display: 'grid', gap: 12 }}>
            <h2 className="adm-eyebrow" style={{ margin: 0 }}>
              {section.name}
            </h2>

            <div className="adm-grid adm-grid--3">
              {resources.map((resource) => (
                <RecordTile
                  key={resource.key}
                  resource={resource}
                  count={counts.data?.[resource.key] ?? null}
                  loading={counts.loading}
                />
              ))}

              {section.links?.map((link) => (
                <Link key={link.to} to={link.to} className="adm-tile">
                  <div className="adm-tile-top">
                    <span className="adm-metric-icon">
                      <Glyph name={link.glyph} />
                    </span>
                    <Glyph name="arrow-right" size={16} />
                  </div>
                  <h3>{link.label}</h3>
                  <p>{link.blurb}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

function RecordTile({
  resource,
  count,
  loading,
}: {
  resource: ResourceDef;
  count: number | null;
  loading: boolean;
}) {
  return (
    <Link to={buildPath(ROUTES.adminRecords, { resource: resource.key })} className="adm-tile">
      <div className="adm-tile-top">
        <span className="adm-metric-icon">
          <Glyph name={RESOURCE_GLYPH[resource.key] ?? 'panel'} />
        </span>
        {loading ? (
          <Skeleton height={22} width={40} />
        ) : (
          <span className="adm-tile-count">{count === null ? '—' : count.toLocaleString()}</span>
        )}
      </div>
      <h3>{resource.label}</h3>
      <p>{resource.blurb}</p>
    </Link>
  );
}
