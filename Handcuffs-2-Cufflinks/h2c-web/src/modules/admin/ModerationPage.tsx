import { useCallback, useEffect, useState } from 'react';
import { useUI } from '@/shared/UIContext';
import { getModStories, moderateStory, type ModStory } from '@/services/auth';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export function ModerationPage() {
  const { showToast } = useUI();
  const [tab, setTab] = useState('pending');
  const [stories, setStories] = useState<ModStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getModStories(tab);
      setStories(res.data);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = useCallback(
    async (id: string, status: 'approved' | 'rejected') => {
      setBusyId(id);
      try {
        await moderateStory(id, status);
        setStories((prev) => prev.filter((s) => s._id !== id));
        showToast(status === 'approved' ? 'Story approved.' : 'Story rejected.');
      } catch {
        showToast('Action failed.');
      } finally {
        setBusyId(null);
      }
    },
    [showToast],
  );

  return (
    <div>
      <h1 className="h2" style={{ marginBottom: 4 }}>
        Moderation
      </h1>
      <p className="body">Review community story submissions before they go public.</p>

      <div style={{ display: 'flex', gap: 8, margin: '20px 0' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className="filter-chip"
            style={
              tab === t.key ? { borderColor: 'var(--brass)', color: 'var(--brass)' } : undefined
            }
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="body">Loading…</p>
      ) : stories.length === 0 ? (
        <p className="body">Nothing here.</p>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {stories.map((s) => (
            <div key={s._id} style={{ border: '1px solid var(--rule)', padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <h3 className="h3" style={{ margin: 0 }}>
                  {s.title}
                </h3>
                <span className="audio-note">
                  {s.name} · {new Date(s.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="body" style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
                {s.story}
              </p>
              {tab === 'pending' && (
                <div className="btn-row" style={{ marginTop: 8 }}>
                  <button
                    className="btn btn--gold btn--sm"
                    disabled={busyId === s._id}
                    onClick={() => void decide(s._id, 'approved')}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn--ghost btn--sm"
                    disabled={busyId === s._id}
                    onClick={() => void decide(s._id, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
