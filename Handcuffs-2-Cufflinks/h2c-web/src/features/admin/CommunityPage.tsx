import { useState } from 'react';
import { Seo } from '@/lib/seo/Seo';
import { apiGet, apiPost } from '@/lib/api/client';
import { useAuth } from '@/providers/context/auth';
import { useToast } from '@/providers/context/toast';
import type { Paginated } from '@/types/common';
import { AdminHeader, Alert, EmptyState, Pager, StatusPill } from './components/Chrome';
import { messageFor, useAsyncData } from './lib/useAsyncData';

/**
 * Community moderation.
 *
 * Two gates stand between a submission and the public site, and this screen
 * shows both: a moderator has to approve it, and the author has to have granted
 * permission to publish. The consent state is displayed rather than assumed
 * because the API refuses a publish without it — and a moderator who cannot see
 * why will read that refusal as a bug.
 *
 * Author email is visible here and nowhere else. It is how a moderator asks for
 * the permission a story is missing.
 */

type ModerationState = 'pending' | 'approved' | 'rejected' | 'needs-changes';

interface Story {
  id: string;
  authorName: string;
  authorEmail?: string;
  authorLocation?: string;
  transformationArc: string;
  fullStory: string;
  quote?: string;
  videoUrl?: string;
  isFeatured?: boolean;
  status: string;
  createdAt: string;
  consent?: {
    publishStory?: boolean;
    publishName?: boolean;
    publishImagery?: boolean;
    contactForFollowUp?: boolean;
  };
  moderation?: { state: ModerationState; notes?: string };
}

interface Nomination {
  id: string;
  nomineeName: string;
  nomineeStory: string;
  nominatorName: string;
  nominatorEmail: string;
  relationship?: string;
  createdAt: string;
}

interface Application {
  id: string;
  kind: 'volunteer' | 'mentorship';
  name: string;
  email: string;
  phone?: string;
  interests?: string[];
  availability?: string;
  message?: string;
  createdAt: string;
}

type Tab = 'stories' | 'nominations' | 'applications';

export function AdminCommunityPage() {
  const { hasPermission } = useAuth();
  const [tab, setTab] = useState<Tab>('stories');

  if (!hasPermission('community:moderate')) {
    return (
      <>
        <AdminHeader eyebrow="Community" title="Submissions and moderation" />
        <Alert title="No access">Your role cannot moderate community submissions.</Alert>
      </>
    );
  }

  return (
    <>
      <Seo title="Community" description="Submissions, moderation, and consent." noIndex />
      <AdminHeader
        eyebrow="Community"
        title="Submissions and moderation"
        intro="Everything the movement sends in. Nothing publishes until a moderator approves it and the author's permission is on record."
      />

      <div className="adm-tabs">
        {(
          [
            ['stories', 'Stories'],
            ['nominations', 'Guest nominations'],
            ['applications', 'Volunteers and mentorship'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`adm-tab ${tab === value ? 'is-on' : ''}`}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'stories' && <Stories />}
      {tab === 'nominations' && <Nominations />}
      {tab === 'applications' && <Applications />}
    </>
  );
}

/* ------------------------------------------------------------------ */

function Stories() {
  const { notify } = useToast();
  const [stateFilter, setStateFilter] = useState<ModerationState | ''>('pending');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const data = useAsyncData<Paginated<Story>>(
    () =>
      apiGet<Paginated<Story>>('/community/stories/admin/all', {
        page,
        pageSize: 25,
        state: stateFilter || undefined,
      }),
    [page, stateFilter]
  );

  const stories = data.data?.items ?? [];

  async function moderate(story: Story, body: Record<string, unknown>, done: string): Promise<void> {
    setBusy(true);
    setActionError(null);
    try {
      await apiPost(`/community/stories/${story.id}/moderate`, body);
      notify(done);
      data.reload();
    } catch (caught) {
      setActionError(messageFor(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="adm-bar">
        <select
          aria-label="Filter by moderation state"
          value={stateFilter}
          onChange={(event) => {
            setStateFilter(event.target.value as ModerationState | '');
            setPage(1);
          }}
        >
          <option value="">Every state</option>
          <option value="pending">Pending review</option>
          <option value="approved">Approved</option>
          <option value="needs-changes">Needs changes</option>
          <option value="rejected">Rejected</option>
        </select>
        <span className="adm-bar-count">{data.data ? `${data.data.total} stories` : ''}</span>
      </div>

      {actionError && <Alert title="That did not go through">{actionError}</Alert>}
      {data.error && <Alert title={data.offline ? 'API unreachable' : 'Could not load'}>{data.error}</Alert>}

      {!data.loading && stories.length === 0 && !data.error && (
        <EmptyState>Nothing in this queue.</EmptyState>
      )}

      <div className="adm-rep">
        {stories.map((story) => {
          const consented = story.consent?.publishStory === true;
          const open = openId === story.id;

          return (
            <div className="adm-repitem" key={story.id}>
              <div className="adm-rephead">
                <div>
                  <span className="adm-repnum">
                    {story.consent?.publishName ? story.authorName : `${story.authorName} — name withheld`}
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>{story.transformationArc}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <StatusPill status={story.moderation?.state ?? 'pending'} />
                    <StatusPill status={story.status} />
                    {!consented && (
                      <span className="adm-pill adm-pill--rejected">No permission to publish</span>
                    )}
                  </div>
                </div>
                <button type="button" className="adm-mini" onClick={() => setOpenId(open ? null : story.id)}>
                  {open ? 'Close' : 'Read'}
                </button>
              </div>

              {open && (
                <>
                  <dl className="adm-defs">
                    <div>
                      <dt>Submitted</dt>
                      <dd>{new Date(story.createdAt).toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt>Contact</dt>
                      <dd>
                        {story.authorEmail ?? '—'}
                        {story.authorLocation ? ` · ${story.authorLocation}` : ''}
                      </dd>
                    </div>
                    <div>
                      <dt>Permissions given</dt>
                      <dd>
                        {[
                          story.consent?.publishStory && 'publish the story',
                          story.consent?.publishName && 'use their name',
                          story.consent?.publishImagery && 'use their images',
                          story.consent?.contactForFollowUp && 'contact for follow-up',
                        ]
                          .filter(Boolean)
                          .join(', ') || 'none'}
                      </dd>
                    </div>
                    {story.videoUrl && (
                      <div>
                        <dt>Video</dt>
                        <dd>{story.videoUrl}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Story</dt>
                      <dd style={{ whiteSpace: 'pre-wrap' }}>{story.fullStory}</dd>
                    </div>
                    {story.moderation?.notes && (
                      <div>
                        <dt>Moderator notes</dt>
                        <dd>{story.moderation.notes}</dd>
                      </div>
                    )}
                  </dl>

                  <ModerationActions
                    story={story}
                    consented={consented}
                    busy={busy}
                    onModerate={moderate}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      {data.data && (
        <Pager
          page={data.data.page}
          totalPages={data.data.totalPages}
          total={data.data.total}
          onChange={setPage}
        />
      )}
    </>
  );
}

function ModerationActions({
  story,
  consented,
  busy,
  onModerate,
}: {
  story: Story;
  consented: boolean;
  busy: boolean;
  onModerate: (story: Story, body: Record<string, unknown>, done: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(story.moderation?.notes ?? '');
  const [quote, setQuote] = useState(story.quote ?? '');
  const [featured, setFeatured] = useState(Boolean(story.isFeatured));

  const base = { notes: notes || undefined, quote: quote || undefined, isFeatured: featured };

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className="adm-row">
        <div className="field">
          <label htmlFor={`quote-${story.id}`}>Pull quote</label>
          <input
            id={`quote-${story.id}`}
            type="text"
            value={quote}
            maxLength={500}
            onChange={(event) => setQuote(event.target.value)}
          />
          <span className="field-hint">Shown on the community page. Use their words, not a summary.</span>
        </div>
        <div className="field">
          <label htmlFor={`notes-${story.id}`}>Moderator notes</label>
          <input
            id={`notes-${story.id}`}
            type="text"
            value={notes}
            maxLength={2000}
            onChange={(event) => setNotes(event.target.value)}
          />
          <span className="field-hint">Internal. Never shown to the author or the public.</span>
        </div>
      </div>

      <label className="check">
        <input type="checkbox" checked={featured} onChange={(event) => setFeatured(event.target.checked)} />
        <span>Feature this story</span>
      </label>

      {!consented && (
        <p className="adm-err" style={{ margin: 0 }}>
          This author did not grant permission to publish. Approving is fine; publishing is refused until they
          do. Their email is above.
        </p>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="adm-mini adm-mini--go"
          disabled={busy || !consented}
          title={consented ? undefined : 'The author has not given permission to publish.'}
          onClick={() =>
            void onModerate(
              story,
              { ...base, state: 'approved', publish: true },
              'Approved and published. It is live on the community page.'
            )
          }
        >
          Approve and publish
        </button>
        <button
          type="button"
          className="adm-mini"
          disabled={busy}
          onClick={() =>
            void onModerate(story, { ...base, state: 'approved', publish: false }, 'Approved, still a draft.')
          }
        >
          Approve only
        </button>
        <button
          type="button"
          className="adm-mini"
          disabled={busy}
          onClick={() =>
            void onModerate(story, { ...base, state: 'needs-changes', publish: false }, 'Marked as needing changes.')
          }
        >
          Needs changes
        </button>
        <button
          type="button"
          className="adm-mini adm-mini--warn"
          disabled={busy}
          onClick={() => void onModerate(story, { ...base, state: 'rejected', publish: false }, 'Rejected.')}
        >
          Reject
        </button>
        {story.status === 'published' && (
          <button
            type="button"
            className="adm-mini"
            disabled={busy}
            onClick={() =>
              void onModerate(story, { ...base, state: 'approved', publish: false }, 'Taken off the site.')
            }
          >
            Take down
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Nominations() {
  const data = useAsyncData<Nomination[]>(() => apiGet<Nomination[]>('/community/guest-nominations'), []);
  const items = data.data ?? [];

  return (
    <>
      {data.error && <Alert title={data.offline ? 'API unreachable' : 'Could not load'}>{data.error}</Alert>}
      {!data.loading && items.length === 0 && !data.error && <EmptyState>No nominations yet.</EmptyState>}

      <div className="adm-rep">
        {items.map((item) => (
          <div className="adm-repitem" key={item.id}>
            <div className="adm-rephead">
              <span className="adm-repnum">{item.nomineeName}</span>
              <span className="adm-metaline">{new Date(item.createdAt).toLocaleDateString()}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{item.nomineeStory}</p>
            <span className="adm-metaline">
              Nominated by {item.nominatorName} · {item.nominatorEmail}
              {item.relationship ? ` · ${item.relationship}` : ''}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function Applications() {
  const data = useAsyncData<Application[]>(() => apiGet<Application[]>('/community/applications'), []);
  const items = data.data ?? [];

  return (
    <>
      {data.error && <Alert title={data.offline ? 'API unreachable' : 'Could not load'}>{data.error}</Alert>}
      {!data.loading && items.length === 0 && !data.error && <EmptyState>No applications yet.</EmptyState>}

      {items.length > 0 && (
        <div className="adm-tablewrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Kind</th>
                <th className="adm-secondary">Contact</th>
                <th className="adm-secondary">Interests</th>
                <th className="adm-secondary">Received</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="adm-cell-strong">{item.name}</td>
                  <td>{item.kind === 'volunteer' ? 'Volunteer' : 'Mentorship'}</td>
                  <td className="adm-secondary">
                    {item.email}
                    {item.phone ? ` · ${item.phone}` : ''}
                  </td>
                  <td className="adm-secondary">
                    <span className="adm-cell-clip">{(item.interests ?? []).join(', ') || '—'}</span>
                  </td>
                  <td className="adm-secondary">{new Date(item.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
