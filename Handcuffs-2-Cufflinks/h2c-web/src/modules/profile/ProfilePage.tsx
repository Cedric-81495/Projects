import { useCallback, useEffect, useState } from 'react';
import { Section, Eyebrow } from '@/shared/ui';
import { AsyncContent } from '@/shared/state';
import { useAsync } from '@/lib/useAsync';
import { useUI } from '@/shared/UIContext';
import { useAuth } from '@/shared/AuthContext';
import {
  getMyProfile,
  updateProfile,
  submitMyStory,
  type ProfileData,
} from '@/services/auth';

const STATUS_LABEL: Record<string, string> = {
  pending: 'In review',
  approved: 'Published',
  rejected: 'Not selected',
};

export function ProfilePage() {
  const { user, logout } = useAuth();
  const { showToast } = useUI();
  const { status, data, reload } = useAsync<ProfileData>(() => getMyProfile(), []);

  return (
    <Section tone="t-1" id="profile">
      <Eyebrow>Your profile</Eyebrow>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          flexWrap: 'wrap',
          marginBottom: 8,
        }}
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt=""
            width={64}
            height={64}
            style={{ borderRadius: '50%', border: '1px solid var(--rule)' }}
          />
        ) : null}
        <div>
          <h1 className="h2" style={{ margin: 0 }}>
            {user?.name}
          </h1>
          <p className="body" style={{ margin: '6px 0 0' }}>
            {user?.email}
            {user?.tier === 'vip' && (
              <span className="tag" style={{ marginLeft: 12, marginBottom: 0 }}>
                VIP
              </span>
            )}
            {user?.role === 'admin' && (
              <span className="tag" style={{ marginLeft: 8, marginBottom: 0 }}>
                Admin
              </span>
            )}
          </p>
        </div>
        <button
          className="btn btn--ghost btn--sm"
          style={{ marginLeft: 'auto' }}
          onClick={() => void logout()}
        >
          Sign out
        </button>
      </div>

      <AsyncContent
        status={status}
        data={data}
        onRetry={reload}
        empty={<p className="body">Could not load your profile.</p>}
      >
        {(data) => (
          <div style={{ marginTop: 26 }}>
            <div className="vals" style={{ marginTop: 0 }}>
              <div>
                <b>{data.stats.submissions}</b>
                <span>Stories shared</span>
              </div>
              <div>
                <b>{data.stats.approved}</b>
                <span>Published</span>
              </div>
              <div>
                <b>{data.stats.pending}</b>
                <span>In review</span>
              </div>
              <div>
                <b>{user?.tier === 'vip' ? 'VIP' : 'Member'}</b>
                <span>Membership</span>
              </div>
            </div>

            <div className="look" style={{ marginTop: 34 }}>
              <ProfileEditor onSaved={reload} />
              <StorySubmit
                onSubmitted={() => {
                  showToast('Story submitted for review.');
                  reload();
                }}
              />
            </div>

            <h3 className="h3" style={{ marginTop: 44 }}>
              Your submissions
            </h3>
            {data.submissions.length === 0 ? (
              <p className="body">You haven’t shared a story yet. Add your first one above.</p>
            ) : (
              <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
                {data.submissions.map((s) => (
                  <div
                    key={s.id}
                    className="audio"
                    style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
                  >
                    <div className="audio-meta">
                      <span className="audio-title">{s.title}</span>
                      <span className="audio-note">
                        {new Date(s.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="tag" style={{ marginBottom: 0 }}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </AsyncContent>
    </Section>
  );
}

function ProfileEditor({ onSaved }: { onSaved: () => void }) {
  const { user, refresh } = useAuth();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
    setLocation(user?.location ?? '');
    setBio(user?.bio ?? '');
  }, [user]);

  const save = useCallback(async () => {
    setSaving(true);
    try {
      await updateProfile({ name, location, bio });
      await refresh();
      onSaved();
    } finally {
      setSaving(false);
    }
  }, [name, location, bio, refresh, onSaved]);

  return (
    <div>
      <h3 className="h3">Edit profile</h3>
      <div className="form" style={{ marginTop: 16 }}>
        <div className="field">
          <label htmlFor="pf-name">Name</label>
          <input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pf-loc">Location</label>
          <input
            id="pf-loc"
            value={location}
            placeholder="City, Country"
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="pf-bio">Bio</label>
          <textarea
            id="pf-bio"
            value={bio}
            maxLength={600}
            placeholder="A line about your journey."
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
        <button className="btn btn--gold btn--sm" disabled={saving} onClick={() => void save()}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

function StorySubmit({ onSubmitted }: { onSubmitted: () => void }) {
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = title.trim().length > 0 && story.trim().length >= 20 && !busy;

  const submit = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      await submitMyStory({ title: title.trim(), story: story.trim() });
      setTitle('');
      setStory('');
      onSubmitted();
    } catch {
      setErr('Could not submit. Please try again.');
    } finally {
      setBusy(false);
    }
  }, [title, story, onSubmitted]);

  return (
    <div>
      <h3 className="h3">Share your story</h3>
      <p className="body" style={{ marginTop: 8 }}>
        Submitted stories enter moderation before appearing in the community gallery.
      </p>
      <div className="form" style={{ marginTop: 8 }}>
        <div className="field">
          <label htmlFor="st-title">Title</label>
          <input id="st-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="st-story">Your story</label>
          <textarea
            id="st-story"
            value={story}
            placeholder="Where you started, the turn, and where you are now."
            onChange={(e) => setStory(e.target.value)}
          />
        </div>
        {err && <p className="said">{err}</p>}
        <button className="btn btn--gold btn--sm" disabled={!canSubmit} onClick={() => void submit()}>
          {busy ? 'Submitting…' : 'Submit story'}
        </button>
      </div>
    </div>
  );
}
