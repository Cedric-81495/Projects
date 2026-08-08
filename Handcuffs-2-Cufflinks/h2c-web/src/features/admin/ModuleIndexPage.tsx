import { Link } from 'react-router-dom';
import { Seo } from '@/lib/seo/Seo';
import { apiGet } from '@/lib/api/client';
import { useAuth } from '@/providers/context/auth';
import { ROUTES, buildPath } from '@/router/routes';
import type { Paginated } from '@/types/common';
import { AdminHeader, Alert } from './components/Chrome';
import { resourcesInGroup } from './lib/resources';
import type { ResourceDef, ResourceGroup } from './lib/resources';
import { useAsyncData } from './lib/useAsyncData';

/** A card that is not a record list — settings, moderation, and so on. */
export interface ModuleLink {
  to: string;
  label: string;
  blurb: string;
}

export interface ModuleSection {
  name: string;
  groups?: ResourceGroup[];
  links?: ModuleLink[];
}

/**
 * A module's front door.
 *
 * Cards carry a live count because the first question anyone opening a module
 * asks is "how much is in here" — and a count of zero on a module that should
 * have twelve records is the fastest way to notice the API is not connected.
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

  const resources = sections
    .flatMap((section) => (section.groups ?? []).flatMap(resourcesInGroup))
    .filter((resource) => hasPermission(resource.writePermission) || hasPermission('content:read'));

  const counts = useAsyncData<Record<string, number | null>>(async () => {
    const results = await Promise.allSettled(
      resources.map((resource) =>
        apiGet<Paginated<unknown>>(`${resource.basePath}/admin/all`, { pageSize: 1 })
      )
    );
    return Object.fromEntries(
      resources.map((resource, index) => {
        const result = results[index];
        return [resource.key, result.status === 'fulfilled' ? result.value.total : null];
      })
    );
    // Keyed on the resource set, which is stable for a given module and role.
  }, [resources.map((resource) => resource.key).join(',')]);

  return (
    <>
      <Seo title={title} description={intro} noIndex />
      <AdminHeader eyebrow={eyebrow} title={title} intro={intro} />

      {counts.offline && (
        <Alert title="API unreachable">
          Record counts and every screen below need the backend running. Everything else here is
          reachable, but nothing will load.
        </Alert>
      )}

      {sections.map((section) => {
        const sectionResources = (section.groups ?? []).flatMap(resourcesInGroup);
        const visible = sectionResources.filter(
          (resource) => hasPermission(resource.writePermission) || hasPermission('content:read')
        );
        if (visible.length === 0 && !section.links?.length) return null;

        return (
          <section key={section.name} style={{ marginBottom: 'clamp(26px,3vw,42px)' }}>
            <h2 className="h-xs" style={{ marginBottom: 14 }}>
              {section.name}
            </h2>

            <div className="adm-cards">
              {visible.map((resource) => (
                <RecordCard key={resource.key} resource={resource} count={counts.data?.[resource.key] ?? null} />
              ))}

              {section.links?.map((link) => (
                <Link key={link.to} to={link.to} className="adm-card">
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

function RecordCard({ resource, count }: { resource: ResourceDef; count: number | null }) {
  return (
    <Link to={buildPath(ROUTES.adminRecords, { resource: resource.key })} className="adm-card">
      <span className="adm-card-count">{count === null ? '—' : count.toLocaleString()}</span>
      <h3>{resource.label}</h3>
      <p>{resource.blurb}</p>
    </Link>
  );
}
