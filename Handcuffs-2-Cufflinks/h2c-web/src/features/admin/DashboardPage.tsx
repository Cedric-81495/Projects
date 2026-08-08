import { Link } from 'react-router-dom';
import { Seo } from '@/lib/seo/Seo';
import { apiGet } from '@/lib/api/client';
import { API } from '@/lib/api/endpoints';
import { compactCount } from '@/lib/utils/format';
import { useAuth } from '@/providers/context/auth';
import { ROUTES, buildPath } from '@/router/routes';
import { AdminHeader, Alert } from './components/Chrome';
import { useAsyncData } from './lib/useAsyncData';

/**
 * Reporting dashboard.
 *
 * Success on this platform is community growth, not sales, so subscribers lead
 * and apparel follows. The apparel figures are here to answer the one question
 * the showcase exists to answer: what should we make next.
 *
 * Media figures come with their window stated. A number labelled only "plays"
 * gets read as all-time, and the difference matters when someone is deciding
 * whether a release worked.
 */

interface Dashboard {
  movement: { subscribers: number; subscribersLast30Days: number };
  apparel: { likes: number; votes: number; favorites: number; notifyMe: number; shares: number };
  community: { storiesAwaitingReview: number; storiesPublished: number };
  content: { docuseriesEpisodes: number; podcastEpisodes: number; musicReleases: number };
  media: {
    windowDays: number;
    music: Reach;
    docuseries: Reach;
    podcast: Reach;
  };
}

type Reach = Record<string, { reach: number; total: number }>;

export function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const mayRead = hasPermission('analytics:read');

  const state = useAsyncData<Dashboard>(
    () => (mayRead ? apiGet<Dashboard>(API.analytics.dashboard) : Promise.reject(new Error('No access'))),
    [mayRead]
  );

  const data = state.data;
  const figure = (value: number | undefined) => (value === undefined ? '—' : compactCount(value));

  return (
    <>
      <Seo title="Dashboard" description="Engagement across the ecosystem." noIndex />

      <AdminHeader
        eyebrow="Reporting"
        title={user ? `Across the ecosystem` : 'Across the ecosystem'}
        intro="Community growth first, because that is what this platform is measured by. Apparel engagement decides what gets made next."
      />

      {!mayRead && <Alert title="No access">Your role cannot read analytics.</Alert>}
      {state.error && mayRead && (
        <Alert title={state.offline ? 'API unreachable' : 'Could not load'}>{state.error}</Alert>
      )}

      <div className="stats">
        <div className="stat">
          <b>{figure(data?.movement.subscribers)}</b>
          <span>Movement subscribers</span>
        </div>
        <div className="stat">
          <b>{figure(data?.movement.subscribersLast30Days)}</b>
          <span>Joined in the last 30 days</span>
        </div>
        <div className="stat">
          <b>{figure(data?.community.storiesAwaitingReview)}</b>
          <span>Stories awaiting review</span>
        </div>
        <div className="stat">
          <b>{figure(data?.apparel.votes)}</b>
          <span>Release votes</span>
        </div>
      </div>

      <section style={{ marginTop: 'clamp(30px,3.4vw,48px)' }}>
        <h2 className="h-xs">What the movement is asking for</h2>
        <p className="body body--quiet" style={{ maxWidth: '62ch' }}>
          Apparel is not sold online. These are the signals that decide the next drop.
        </p>

        <div className="stats">
          <div className="stat">
            <b>{figure(data?.apparel.likes)}</b>
            <span>Likes</span>
          </div>
          <div className="stat">
            <b>{figure(data?.apparel.favorites)}</b>
            <span>Saved</span>
          </div>
          <div className="stat">
            <b>{figure(data?.apparel.notifyMe)}</b>
            <span>Notify me</span>
          </div>
          <div className="stat">
            <b>{figure(data?.apparel.shares)}</b>
            <span>Shares</span>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 'clamp(30px,3.4vw,48px)' }}>
        <h2 className="h-xs">
          Media, last {data?.media.windowDays ?? 30} days
        </h2>
        <p className="body body--quiet" style={{ maxWidth: '62ch' }}>
          Reach counts distinct people per day; total counts repeats. A hundred plays from four people is a
          different story from a hundred from ninety.
        </p>

        <div className="adm-tablewrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Measure</th>
                <th className="adm-num">Reach</th>
                <th className="adm-num">Total</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ['Music', data?.media.music],
                  ['Docuseries', data?.media.docuseries],
                  ['Podcast', data?.media.podcast],
                ] as const
              ).flatMap(([label, group]) =>
                Object.entries(group ?? { plays: { reach: 0, total: 0 } }).map(([measure, value], index) => (
                  <tr key={`${label}-${measure}`}>
                    <td className={index === 0 ? 'adm-cell-strong' : undefined}>{index === 0 ? label : ''}</td>
                    <td>{measure.replace(/([A-Z])/g, ' $1').toLowerCase()}</td>
                    <td className="adm-num">{data ? value.reach.toLocaleString() : '—'}</td>
                    <td className="adm-num">{data ? value.total.toLocaleString() : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 'clamp(30px,3.4vw,48px)' }}>
        <h2 className="h-xs">Published right now</h2>
        <div className="adm-cards">
          <Link to={buildPath(ROUTES.adminRecords, { resource: 'docuseries' })} className="adm-card">
            <span className="adm-card-count">{figure(data?.content.docuseriesEpisodes)}</span>
            <h3>Docuseries episodes</h3>
            <p>Live transformation stories.</p>
          </Link>
          <Link to={buildPath(ROUTES.adminRecords, { resource: 'podcast-episodes' })} className="adm-card">
            <span className="adm-card-count">{figure(data?.content.podcastEpisodes)}</span>
            <h3>Podcast episodes</h3>
            <p>Weekly, per the content plan.</p>
          </Link>
          <Link to={buildPath(ROUTES.adminRecords, { resource: 'releases' })} className="adm-card">
            <span className="adm-card-count">{figure(data?.content.musicReleases)}</span>
            <h3>Music releases</h3>
            <p>The soundtrack of the movement.</p>
          </Link>
          <Link to={ROUTES.adminCommunity} className="adm-card">
            <span className="adm-card-count">{figure(data?.community.storiesPublished)}</span>
            <h3>Community stories</h3>
            <p>Published with the author’s permission on record.</p>
          </Link>
        </div>
      </section>
    </>
  );
}
