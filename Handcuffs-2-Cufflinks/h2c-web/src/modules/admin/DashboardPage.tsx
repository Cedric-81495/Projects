import { useAsync } from '@/lib/useAsync';
import { AsyncContent } from '@/shared/state';
import { getAdminStats, type AdminStats, type AuthUser } from '@/services/auth';

const CARDS: { key: keyof AdminStats; label: string }[] = [
  { key: 'users', label: 'Members' },
  { key: 'pendingStories', label: 'Stories to review' },
  { key: 'approvedStories', label: 'Approved stories' },
  { key: 'newsletter', label: 'Newsletter subs' },
  { key: 'publishedStories', label: 'Published docuseries' },
  { key: 'episodes', label: 'Podcast episodes' },
  { key: 'tracks', label: 'Music tracks' },
  { key: 'admins', label: 'Admins' },
];

export function DashboardPage() {
  const { status, data, reload } = useAsync(() => getAdminStats(), []);

  return (
    <div>
      <h1 className="h2" style={{ marginBottom: 4 }}>
        Dashboard
      </h1>
      <p className="body">A live snapshot of the movement.</p>

      <AsyncContent status={status} data={data} onRetry={reload}>
        {(d) => (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 14,
                marginTop: 24,
              }}
            >
              {CARDS.map((c) => (
                <div
                  key={c.key}
                  style={{ border: '1px solid var(--rule)', padding: '20px 18px' }}
                >
                  <div
                    className="gold-t"
                    style={{ fontFamily: 'var(--f-display)', fontSize: '2.4rem', lineHeight: 1 }}
                  >
                    {d.stats[c.key]}
                  </div>
                  <div className="audio-note" style={{ marginTop: 8 }}>
                    {c.label}
                  </div>
                </div>
              ))}
            </div>

            <h3 className="h3" style={{ marginTop: 40 }}>
              Newest members
            </h3>
            <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
              {d.recentUsers.length === 0 && <p className="body">No members yet.</p>}
              {d.recentUsers.map((u: AuthUser) => (
                <div
                  key={u.id}
                  className="audio"
                  style={{ justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div className="audio-meta">
                    <span className="audio-title" style={{ fontSize: '0.95rem' }}>
                      {u.name}
                    </span>
                    <span className="audio-note">{u.email}</span>
                  </div>
                  <span className="tag" style={{ marginBottom: 0 }}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </AsyncContent>
    </div>
  );
}
