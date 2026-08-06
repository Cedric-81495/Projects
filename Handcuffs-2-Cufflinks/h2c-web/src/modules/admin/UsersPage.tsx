import { useCallback, useEffect, useState } from 'react';
import { useUI } from '@/shared/UIContext';
import {
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  type AuthUser,
} from '@/services/auth';

export function UsersPage() {
  const { showToast } = useUI();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminUsers({ search, role, status: statusFilter });
      setUsers(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [search, role, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 250);
    return () => clearTimeout(t);
  }, [load]);

  const act = useCallback(
    async (id: string, patch: Parameters<typeof updateAdminUser>[1], msg: string) => {
      setBusyId(id);
      try {
        const { user } = await updateAdminUser(id, patch);
        setUsers((prev) => prev.map((u) => (u.id === id ? user : u)));
        showToast(msg);
      } catch {
        showToast('Action failed.');
      } finally {
        setBusyId(null);
      }
    },
    [showToast],
  );

  const remove = useCallback(
    async (id: string, name: string) => {
      if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
      setBusyId(id);
      try {
        await deleteAdminUser(id);
        setUsers((prev) => prev.filter((u) => u.id !== id));
        showToast('User deleted.');
      } catch {
        showToast('Delete failed.');
      } finally {
        setBusyId(null);
      }
    },
    [showToast],
  );

  return (
    <div>
      <h1 className="h2" style={{ marginBottom: 4 }}>
        Users
      </h1>
      <p className="body">{total} member{total === 1 ? '' : 's'} total.</p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '20px 0 8px' }}>
        <input
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1 1 240px',
            background: 'transparent',
            border: '1px solid var(--rule)',
            color: 'var(--fg)',
            padding: '10px 14px',
          }}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ background: 'var(--ink)', border: '1px solid var(--rule)', color: 'var(--fg)', padding: '10px' }}
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ background: 'var(--ink)', border: '1px solid var(--rule)', color: 'var(--fg)', padding: '10px' }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading ? (
        <p className="body">Loading…</p>
      ) : users.length === 0 ? (
        <p className="body">No users match.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
          {users.map((u) => (
            <div
              key={u.id}
              style={{
                display: 'flex',
                gap: 14,
                alignItems: 'center',
                flexWrap: 'wrap',
                border: '1px solid var(--rule)',
                padding: '14px 16px',
                opacity: u.status === 'suspended' ? 0.6 : 1,
              }}
            >
              <div style={{ minWidth: 0, flex: '1 1 200px' }}>
                <div style={{ fontWeight: 600 }}>{u.name}</div>
                <div className="audio-note">{u.email}</div>
              </div>
              <span className="tag" style={{ marginBottom: 0 }}>
                {u.role}
              </span>
              <span className="tag" style={{ marginBottom: 0 }}>
                {u.status}
              </span>
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
                {u.role === 'user' ? (
                  <button
                    className="btn btn--ghost btn--sm"
                    disabled={busyId === u.id}
                    onClick={() => void act(u.id, { role: 'admin' }, 'Promoted to admin.')}
                  >
                    Make admin
                  </button>
                ) : (
                  <button
                    className="btn btn--ghost btn--sm"
                    disabled={busyId === u.id}
                    onClick={() => void act(u.id, { role: 'user' }, 'Admin revoked.')}
                  >
                    Revoke admin
                  </button>
                )}
                {u.status === 'active' ? (
                  <button
                    className="btn btn--ghost btn--sm"
                    disabled={busyId === u.id}
                    onClick={() => void act(u.id, { status: 'suspended' }, 'User suspended.')}
                  >
                    Suspend
                  </button>
                ) : (
                  <button
                    className="btn btn--ghost btn--sm"
                    disabled={busyId === u.id}
                    onClick={() => void act(u.id, { status: 'active' }, 'User reactivated.')}
                  >
                    Reactivate
                  </button>
                )}
                <button
                  className="btn btn--ghost btn--sm"
                  disabled={busyId === u.id}
                  onClick={() => void remove(u.id, u.name)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
