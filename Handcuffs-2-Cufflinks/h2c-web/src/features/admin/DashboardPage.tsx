import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Seo } from '@/lib/seo/Seo';
import { apiGet } from '@/lib/api/client';
import { API } from '@/lib/api/endpoints';
import { useAuth } from '@/providers/context/auth';
import { ROUTES, buildPath } from '@/router/routes';
import { AdminHeader, Alert, Card, EmptyState, Note, Skeleton } from './components/Chrome';
import { Glyph } from './components/Glyph';
import { MetricCard } from './components/MetricCard';
import { AreaChart } from './components/charts/AreaChart';
import { BarChart } from './components/charts/BarChart';
import { Meter } from './components/charts/Meter';
import { useAsyncData } from './lib/useAsyncData';

/**
 * Reporting dashboard.
 *
 * The guide is explicit that success here is community growth, not sales, so
 * the hero figure is subscribers and apparel sits below it — present to answer
 * one question, which is what to make next.
 *
 * Every window is stated in the copy rather than assumed. A number labelled
 * only "plays" gets read as all-time, and the difference matters when someone
 * is deciding whether a release worked.
 */

interface Reach {
  reach: number;
  total: number;
}

interface Dashboard {
  movement: { subscribers: number; subscribersLast30Days: number };
  apparel: { likes: number; votes: number; favorites: number; notifyMe: number; shares: number };
  community: { storiesAwaitingReview: number; storiesPublished: number };
  content: { docuseriesEpisodes: number; podcastEpisodes: number; musicReleases: number };
  media: {
    windowDays: number;
    music: Record<string, Reach>;
    docuseries: Record<string, Reach>;
    podcast: Record<string, Reach>;
  };
}

interface Trend {
  days: number;
  series: { day: string; visitorDays: number; occurrences: number }[];
}

interface TopItem {
  targetType: string;
  targetId: string;
  title?: string;
  total: number;
  actions: { action: string; visitorDays: number; occurrences: number }[];
}

interface Report {
  windowDays: number;
  items: TopItem[];
}

const WINDOWS = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

const CHANNELS = [
  { key: '', label: 'Everything' },
  { key: 'music-release', label: 'Music' },
  { key: 'docuseries-episode', label: 'Docuseries' },
  { key: 'podcast-episode', label: 'Podcast' },
];

const TYPE_LABEL: Record<string, string> = {
  'music-release': 'Music',
  'docuseries-episode': 'Docuseries',
  'podcast-episode': 'Podcast',
  'podcast-clip': 'Clip',
};

export function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const mayRead = hasPermission('analytics:read');

  const [days, setDays] = useState(30);
  const [channel, setChannel] = useState('');

  const dash = useAsyncData<Dashboard>(
    () => (mayRead ? apiGet<Dashboard>(API.analytics.dashboard) : Promise.reject(new Error('No access'))),
    [mayRead]
  );

  const trend = useAsyncData<Trend>(
    () =>
      mayRead
        ? apiGet<Trend>('/media-engagement/trend', {
            days,
            action: 'play',
            targetType: channel || undefined,
          })
        : Promise.reject(new Error('No access')),
    [mayRead, days, channel]
  );

  const top = useAsyncData<Report>(
    () =>
      mayRead
        ? apiGet<Report>('/media-engagement/report', { days, limit: 6, targetType: channel || undefined })
        : Promise.reject(new Error('No access')),
    [mayRead, days, channel]
  );

  const data = dash.data;
  const figure = (value: number | undefined) => (value === undefined ? '—' : value.toLocaleString());

  const series = (trend.data?.series ?? []).map((point) => ({ day: point.day, value: point.occurrences }));
  const sparkline = series.slice(-12).map((point) => point.value);

  const firstName = user?.fullName?.trim().split(/\s+/)[0];

  return (
    <>
      <Seo title="Dashboard" description="Engagement across the ecosystem." noIndex />

      <AdminHeader
        eyebrow="Reporting"
        title={firstName ? `Good to see you, ${firstName}` : 'Across the ecosystem'}
        intro="Community growth first — that is what this platform is measured by. Apparel engagement decides what gets made next."
        actions={
          <>
            <div className="adm-seg" role="group" aria-label="Reporting window">
              {WINDOWS.map((option) => (
                <button
                  key={option.days}
                  type="button"
                  className={days === option.days ? 'is-on' : undefined}
                  onClick={() => setDays(option.days)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="adm-btn adm-btn--sm"
              onClick={() => {
                dash.reload();
                trend.reload();
                top.reload();
              }}
            >
              <Glyph name="refresh" />
              Refresh
            </button>
          </>
        }
      />

      {!mayRead && <Alert title="No access">Your role cannot read analytics.</Alert>}
      {mayRead && dash.error && (
        <Alert title={dash.offline ? 'API unreachable' : 'Could not load'}>{dash.error}</Alert>
      )}

      {/* --- North Star --------------------------------------------------- */}

      <div className="adm-grid adm-grid--wide">
        <Card
          title="Join the Movement"
          description="The North Star metric. Every page on the public site guides toward this one action."
          actions={
            <Link className="adm-btn adm-btn--sm" to={ROUTES.adminSubscribers}>
              Open subscribers
              <Glyph name="arrow-right" />
            </Link>
          }
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-end' }}>
            <div style={{ display: 'grid', gap: 6 }}>
              {dash.loading ? (
                <Skeleton height={54} width={190} />
              ) : (
                <span className="adm-hero">{figure(data?.movement.subscribers)}</span>
              )}
              <span className="adm-metric-label">people in the movement</span>
            </div>

            {!dash.loading && data && (
              <div className="adm-metric-foot" style={{ paddingBottom: 6 }}>
                <span className="adm-delta adm-delta--up">
                  <Glyph name="arrow-up" />
                  {data.movement.subscribersLast30Days.toLocaleString()}
                </span>
                <span className="adm-metric-note">joined in the last 30 days</span>
              </div>
            )}
          </div>
        </Card>

        <Card title="Needs you" description="Work waiting on a person rather than a schedule.">
          <div style={{ display: 'grid', gap: 12 }}>
            <QueueRow
              to={ROUTES.adminCommunity}
              glyph="people"
              label="Stories awaiting review"
              value={data?.community.storiesAwaitingReview}
              loading={dash.loading}
              urgent={(data?.community.storiesAwaitingReview ?? 0) > 0}
            />
            <QueueRow
              to={ROUTES.adminMedia}
              glyph="image"
              label="Media library"
              value={undefined}
              loading={false}
              hint="Register assets so alt text is written once"
            />
            <QueueRow
              to={buildPath(ROUTES.adminRecords, { resource: 'announcements' })}
              glyph="sparkle"
              label="Announcements"
              value={undefined}
              loading={false}
              hint="Time-bounded, so they retire themselves"
            />
          </div>
        </Card>
      </div>

      {/* --- Metric row --------------------------------------------------- */}

      <div className="adm-grid adm-grid--4">
        <MetricCard
          label="Docuseries episodes live"
          value={figure(data?.content.docuseriesEpisodes)}
          glyph="film"
          loading={dash.loading}
          note="Transformation stories"
        />
        <MetricCard
          label="Podcast episodes live"
          value={figure(data?.content.podcastEpisodes)}
          glyph="mic"
          loading={dash.loading}
          note="Weekly, per the content plan"
        />
        <MetricCard
          label="Music releases live"
          value={figure(data?.content.musicReleases)}
          glyph="note"
          loading={dash.loading}
          note="Kitchen Muzik Management"
        />
        <MetricCard
          label="Community stories published"
          value={figure(data?.community.storiesPublished)}
          glyph="people"
          loading={dash.loading}
          note="With permission on record"
        />
      </div>

      {/* --- Trend -------------------------------------------------------- */}

      <Card
        title={`Plays over the last ${days} days`}
        description="Counts every play, including repeats by the same person. The reach panel below separates the two."
        actions={
          <div className="adm-seg" role="group" aria-label="Channel">
            {CHANNELS.map((option) => (
              <button
                key={option.key || 'all'}
                type="button"
                className={channel === option.key ? 'is-on' : undefined}
                onClick={() => setChannel(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      >
        {trend.error ? (
          <Note title={trend.offline ? 'API unreachable' : 'Could not load'} tone="bad">
            {trend.error}
          </Note>
        ) : trend.loading ? (
          <Skeleton height={240} />
        ) : (
          <AreaChart points={series} label="Plays" />
        )}
      </Card>

      {/* --- Demand + reach ----------------------------------------------- */}

      <div className="adm-grid adm-grid--2">
        <Card
          title="What the movement is asking for"
          description="Apparel is not sold online. These signals decide the next drop."
          actions={
            <Link className="adm-btn adm-btn--sm" to={buildPath(ROUTES.adminRecords, { resource: 'apparel' })}>
              Open apparel
              <Glyph name="arrow-right" />
            </Link>
          }
        >
          {dash.loading ? (
            <div style={{ display: 'grid', gap: 18 }}>
              {[0, 1, 2, 3, 4].map((row) => (
                <Skeleton key={row} height={26} />
              ))}
            </div>
          ) : (
            <BarChart
              valueLabel="from visitors"
              emptyMessage="No apparel engagement recorded yet."
              rows={
                data
                  ? [
                      { label: 'Likes', value: data.apparel.likes },
                      { label: 'Saved', value: data.apparel.favorites },
                      { label: 'Votes for a release', value: data.apparel.votes },
                      { label: 'Notify me', value: data.apparel.notifyMe },
                      { label: 'Shares', value: data.apparel.shares },
                    ]
                  : []
              }
            />
          )}
        </Card>

        <Card
          title={`Reach, last ${data?.media.windowDays ?? 30} days`}
          description="How much of the play count is distinct people. A hundred plays from four is a different story from a hundred from ninety."
        >
          {dash.loading ? (
            <div style={{ display: 'grid', gap: 20 }}>
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} height={40} />
              ))}
            </div>
          ) : data ? (
            <div style={{ display: 'grid', gap: 18 }}>
              <Meter
                name="Music"
                value={data.media.music.plays?.reach ?? 0}
                of={data.media.music.plays?.total ?? 0}
                valueLabel="distinct visitor-days"
                ofLabel="plays"
              />
              <Meter
                name="Docuseries"
                value={data.media.docuseries.plays?.reach ?? 0}
                of={data.media.docuseries.plays?.total ?? 0}
                valueLabel="distinct visitor-days"
                ofLabel="plays"
              />
              <Meter
                name="Podcast"
                value={data.media.podcast.plays?.reach ?? 0}
                of={data.media.podcast.plays?.total ?? 0}
                valueLabel="distinct visitor-days"
                ofLabel="plays"
              />
            </div>
          ) : (
            <EmptyState title="Nothing yet">Media engagement appears once visitors start playing things.</EmptyState>
          )}
        </Card>
      </div>

      {/* --- Top content -------------------------------------------------- */}

      <Card
        title={`Most engaged, last ${days} days`}
        description="Ranked by distinct visitor-days across every action, so one enthusiast cannot carry a record to the top."
        flush
      >
        {top.error ? (
          <div style={{ padding: 18 }}>
            <Note title={top.offline ? 'API unreachable' : 'Could not load'} tone="bad">
              {top.error}
            </Note>
          </div>
        ) : top.loading ? (
          <div style={{ padding: 18, display: 'grid', gap: 14 }}>
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} height={16} />
            ))}
          </div>
        ) : (top.data?.items.length ?? 0) === 0 ? (
          <EmptyState title="No engagement yet">
            Nothing has been played, viewed, or shared in this window. Publish something and check back.
          </EmptyState>
        ) : (
          <div className="adm-tablewrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Channel</th>
                  <th className="adm-secondary">Actions recorded</th>
                  <th className="adm-num">Visitor-days</th>
                </tr>
              </thead>
              <tbody>
                {top.data?.items.map((item) => (
                  <tr key={`${item.targetType}-${item.targetId}`}>
                    <td className="adm-strong">
                      <span className="adm-clip">{item.title ?? item.targetId}</span>
                    </td>
                    <td>{TYPE_LABEL[item.targetType] ?? item.targetType}</td>
                    <td className="adm-secondary">
                      <span className="adm-clip">
                        {item.actions.map((action) => `${action.action} ${action.visitorDays}`).join(' · ')}
                      </span>
                    </td>
                    <td className="adm-num adm-strong">{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {sparkline.length > 1 && (
        <p className="adm-hint" style={{ margin: 0 }}>
          Figures are read live from the API. Nothing on this screen is seeded or sampled.
        </p>
      )}
    </>
  );
}

function QueueRow({
  to,
  glyph,
  label,
  value,
  loading,
  urgent,
  hint,
}: {
  to: string;
  glyph: 'people' | 'image' | 'sparkle';
  label: string;
  value: number | undefined;
  loading: boolean;
  urgent?: boolean;
  hint?: string;
}) {
  return (
    <Link
      to={to}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 'var(--r)',
        border: '1px solid var(--line)',
        background: 'var(--surface-2)',
        color: 'var(--ink)',
      }}
    >
      <span className={urgent ? 'adm-metric-icon adm-metric-icon--accent' : 'adm-metric-icon'} style={{ width: 32, height: 32 }}>
        <Glyph name={glyph} size={16} />
      </span>
      <span style={{ display: 'grid', gap: 1, minWidth: 0 }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{label}</span>
        {hint && <span className="adm-metric-note">{hint}</span>}
      </span>
      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {loading ? (
          <Skeleton height={16} width={28} />
        ) : value !== undefined ? (
          <b style={{ fontSize: '0.95rem', fontWeight: 600 }}>{value.toLocaleString()}</b>
        ) : null}
        <Glyph name="chevron-right" size={15} />
      </span>
    </Link>
  );
}
