import { useState } from 'react';
import { Seo } from '@/lib/seo/Seo';
import { apiGet, apiPatch, apiPost } from '@/lib/api/client';
import { useAuth } from '@/providers/context/auth';
import { useToast } from '@/providers/context/toast';
import type { Paginated } from '@/types/common';
import type { AdminUser, Role } from '@/types/auth';
import { AdminHeader, Alert, EmptyState, Pager } from './components/Chrome';
import { RecordForm } from './components/RecordForm';
import type { Field } from './lib/fields';
import { messageFor, useAsyncData } from './lib/useAsyncData';

/**
 * Users, roles, and the audit log.
 *
 * The one area where a mistake hands over the whole platform, so it is
 * super-admin only and the API keeps two guards the UI cannot talk it out of:
 * you cannot change your own role, and the last active Super Administrator
 * cannot be demoted or deactivated.
 */

interface StaffUser extends AdminUser {
  isActive?: boolean;
}

interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  actorEmail?: string;
  ip?: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

const NEW_USER_FIELDS: Field[] = [
  { kind: 'text', name: 'fullName', label: 'Full name', required: true, half: true },
  { kind: 'text', name: 'email', label: 'Email', format: 'email', required: true, half: true },
  {
    kind: 'text',
    name: 'password',
    label: 'Initial password',
    required: true,
    hint: 'At least 12 characters — a short phrase works well. They should change it after signing in.',
  },
  {
    kind: 'select',
    name: 'role',
    label: 'Role',
    half: true,
    options: [
      { value: 'admin', label: 'Admin (VA) — publishes and moderates' },
      { value: 'super-admin', label: 'Super Administrator — full access' },
    ],
  },
];

export function AdminUsersPage() {
  const { hasPermission } = useAuth();
  const [tab, setTab] = useState<'users' | 'audit'>('users');

  if (!hasPermission('users:manage')) {
    return (
      <>
        <AdminHeader eyebrow="Access" title="Users and roles" />
        <Alert title="No access">
          User administration is restricted to Super Administrators.
        </Alert>
      </>
    );
  }

  return (
    <>
      <Seo title="Users and roles" description="Staff accounts and the audit log." noIndex />
      <AdminHeader
        eyebrow="Access"
        title="Users and roles"
        intro="Super Administrators and Admins. Every role change, publish, and deletion is recorded in the audit log."
      />

      <div className="adm-tabs">
        <button
          type="button"
          className={`adm-tab ${tab === 'users' ? 'is-on' : ''}`}
          onClick={() => setTab('users')}
        >
          Users
        </button>
        {hasPermission('audit:read') && (
          <button
            type="button"
            className={`adm-tab ${tab === 'audit' ? 'is-on' : ''}`}
            onClick={() => setTab('audit')}
          >
            Audit log
          </button>
        )}
      </div>

      {tab === 'users' ? <Users /> : <AuditLog />}
    </>
  );
}

function Users() {
  const { user: me } = useAuth();
  const { notify } = useToast();

  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const state = useAsyncData<StaffUser[]>(() => apiGet<StaffUser[]>('/users'), []);
  const users = state.data ?? [];

  async function run(id: string, work: () => Promise<unknown>, done: string): Promise<void> {
    setBusyId(id);
    setActionError(null);
    try {
      await work();
      notify(done);
      state.reload();
    } catch (caught) {
      setActionError(messageFor(caught));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="adm-bar">
        <button type="button" className="adm-mini adm-mini--go" onClick={() => setAdding(!adding)}>
          {adding ? 'Close' : 'Add a user'}
        </button>
        <span className="adm-bar-count">{users.length} accounts</span>
      </div>

      {actionError && <Alert title="That did not go through">{actionError}</Alert>}
      {state.error && <Alert title={state.offline ? 'API unreachable' : 'Could not load'}>{state.error}</Alert>}

      {adding && (
        <div className="adm-repitem" style={{ marginBottom: 22 }}>
          <div className="adm-rephead">
            <span className="adm-repnum">New user</span>
          </div>
          <RecordForm
            fields={NEW_USER_FIELDS}
            record={{ role: 'admin' }}
            submitLabel="Create account"
            onSubmit={async (payload) => {
              await apiPost('/users', payload);
              notify('Account created. Ask them to sign in and change the password.');
              setAdding(false);
              state.reload();
            }}
          />
        </div>
      )}

      {!state.loading && users.length === 0 && !state.error && <EmptyState>No accounts.</EmptyState>}

      {users.length > 0 && (
        <div className="adm-tablewrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th className="adm-secondary">Verified</th>
                <th className="adm-secondary">MFA</th>
                <th className="adm-secondary">Last signed in</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.id === me?.id;
                const active = user.isActive !== false;

                return (
                  <tr key={user.id}>
                    <td className="adm-cell-strong">
                      {user.fullName}
                      {isSelf && <span className="adm-metaline"> · you</span>}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        aria-label={`Role for ${user.fullName}`}
                        value={user.role}
                        disabled={isSelf || busyId === user.id}
                        onChange={(event) =>
                          void run(
                            user.id,
                            () => apiPatch(`/users/${user.id}/role`, { role: event.target.value as Role }),
                            'Role changed. Their existing sessions were ended.'
                          )
                        }
                        style={{
                          padding: '6px 8px',
                          background: 'transparent',
                          border: '1px solid var(--rule)',
                          color: 'var(--fg)',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--sans)',
                        }}
                      >
                        <option value="admin">Admin</option>
                        <option value="super-admin">Super Administrator</option>
                      </select>
                    </td>
                    <td className="adm-secondary">{user.emailVerified ? 'Yes' : 'No'}</td>
                    <td className="adm-secondary">{user.mfaEnabled ? 'On' : 'Off'}</td>
                    <td className="adm-secondary">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                    </td>
                    <td>
                      <div className="adm-rowacts">
                        {!isSelf && (
                          <button
                            type="button"
                            className={active ? 'adm-mini adm-mini--warn' : 'adm-mini'}
                            disabled={busyId === user.id}
                            onClick={() =>
                              void run(
                                user.id,
                                () => apiPatch(`/users/${user.id}/status`, { isActive: !active }),
                                active
                                  ? 'Deactivated. Their sessions were ended.'
                                  : 'Reactivated.'
                              )
                            }
                          >
                            {active ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                        {isSelf && <span className="adm-metaline">Manage your own account elsewhere</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function AuditLog() {
  const [page, setPage] = useState(1);
  const [resource, setResource] = useState('');

  const state = useAsyncData<Paginated<AuditEntry>>(
    () =>
      apiGet<Paginated<AuditEntry>>('/users/audit-log', {
        page,
        pageSize: 50,
        resource: resource || undefined,
      }),
    [page, resource]
  );

  const entries = state.data?.items ?? [];

  return (
    <>
      <div className="adm-bar">
        <input
          type="text"
          aria-label="Filter by resource"
          placeholder="Filter by resource, e.g. collection"
          value={resource}
          onChange={(event) => {
            setResource(event.target.value);
            setPage(1);
          }}
        />
        <span className="adm-bar-count">{state.data ? `${state.data.total} entries` : ''}</span>
      </div>

      {state.error && <Alert title={state.offline ? 'API unreachable' : 'Could not load'}>{state.error}</Alert>}
      {!state.loading && entries.length === 0 && !state.error && <EmptyState>Nothing recorded yet.</EmptyState>}

      {entries.length > 0 && (
        <div className="adm-tablewrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Action</th>
                <th className="adm-secondary">Record</th>
                <th className="adm-secondary">From</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.createdAt).toLocaleString()}</td>
                  <td className="adm-cell-strong">{entry.actorEmail ?? '—'}</td>
                  <td>{entry.action}</td>
                  <td className="adm-secondary">
                    <span className="adm-cell-clip">
                      {entry.resource}
                      {entry.resourceId ? ` · ${entry.resourceId}` : ''}
                    </span>
                  </td>
                  <td className="adm-secondary">{entry.ip ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {state.data && (
        <Pager
          page={state.data.page}
          totalPages={state.data.totalPages}
          total={state.data.total}
          onChange={setPage}
        />
      )}
    </>
  );
}
