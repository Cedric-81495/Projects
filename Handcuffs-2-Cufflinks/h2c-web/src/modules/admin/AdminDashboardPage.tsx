import { useCallback, useEffect, useState } from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { adminApi, type Submission } from '@/services/admin';
import { cn } from '@/lib/cn';

type Tab = 'pending' | 'approved' | 'rejected';
const tabs: Tab[] = ['pending', 'approved', 'rejected'];

export function AdminDashboardPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (status: Tab) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await adminApi.listSubmissions(status);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(tab);
  }, [tab, load]);

  async function moderate(id: string, status: 'approved' | 'rejected') {
    setBusyId(id);
    try {
      await adminApi.moderate(id, status);
      setItems((prev) => prev.filter((s) => s._id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="min-h-[80vh] bg-ink py-16">
      <Container>
        <div>
          <Eyebrow>Moderation</Eyebrow>
          <h1 className="mt-4 font-display text-display-md font-semibold text-bone">
            Community submissions
          </h1>
        </div>

        <div className="mt-8 flex gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'rounded-full border px-5 py-2 text-sm capitalize transition-colors',
                tab === t
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-faint/50 text-muted hover:text-bone',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="animate-spin text-gold" size={26} />
            </div>
          ) : error ? (
            <p className="rounded-xl border border-red-500/40 bg-red-500/5 p-5 text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : items.length === 0 ? (
            <p className="py-16 text-center text-muted">Nothing {tab} right now.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((s) => (
                <li
                  key={s._id}
                  className="rounded-2xl border border-faint/30 bg-onyx p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="font-display text-xl font-semibold text-bone">{s.title}</h2>
                      <p className="mt-1 font-mono text-xs uppercase tracking-eyebrow text-faint">
                        {s.name} · {s.email} · {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {tab === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busyId === s._id}
                          onClick={() => moderate(s._id, 'approved')}
                          className="inline-flex items-center gap-1.5 rounded-full bg-green px-4 py-2 text-sm text-bone transition hover:bg-green-bright disabled:opacity-50"
                        >
                          <Check size={15} /> Approve
                        </button>
                        <button
                          type="button"
                          disabled={busyId === s._id}
                          onClick={() => moderate(s._id, 'rejected')}
                          className="inline-flex items-center gap-1.5 rounded-full border border-faint/50 px-4 py-2 text-sm text-muted transition hover:border-red-500/60 hover:text-red-400 disabled:opacity-50"
                        >
                          <X size={15} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-pretty leading-relaxed text-muted">
                    {s.story}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
