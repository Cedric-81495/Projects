import { Seo } from '@/lib/seo/Seo';
import { apiGet, apiPatch } from '@/lib/api/client';
import { useAuth } from '@/providers/context/auth';
import { useToast } from '@/providers/context/toast';
import { ROUTES } from '@/router/routes';
import { AdminHeader, Alert, Card, Skeleton } from './components/Chrome';
import { RecordForm } from './components/RecordForm';
import type { Field } from './lib/fields';
import { useAsyncData } from './lib/useAsyncData';

/**
 * The founder profile.
 *
 * The guide is explicit that this must not read as a corporate biography, so
 * the fields are the questions the page has to answer — why the movement
 * exists, what the journey was, what it connects to — rather than a single
 * free-text "about" box that invites one.
 */
const FIELDS: Field[] = [
  { kind: 'text', name: 'name', label: 'Name', half: true },
  { kind: 'text', name: 'role', label: 'Role', half: true },
  {
    kind: 'group',
    name: 'portrait',
    label: 'Portrait',
    fields: [
      { kind: 'text', name: 'url', label: 'Address' },
      { kind: 'text', name: 'alt', label: 'Alt text' },
      { kind: 'number', name: 'width', label: 'Width', half: true },
      { kind: 'number', name: 'height', label: 'Height', half: true },
    ],
  },
  { kind: 'textarea', name: 'message', label: 'Message on the homepage', rows: 5 },
  { kind: 'textarea', name: 'story', label: 'The story', rows: 14 },
  { kind: 'textarea', name: 'whyThisExists', label: 'Why the movement exists', rows: 6 },
  { kind: 'tags', name: 'lessonsLearned', label: 'Lessons learned' },
  { kind: 'textarea', name: 'gwopConnection', label: 'Connection to GWOP', rows: 5 },
  { kind: 'textarea', name: 'kitchenMuzikConnection', label: 'Connection to Kitchen Muzik', rows: 5 },
  { kind: 'textarea', name: 'globalVision', label: 'Long-term global vision', rows: 6 },
  { kind: 'tags', name: 'speakingTopics', label: 'Speaking topics' },
  { kind: 'textarea', name: 'speakingBlurb', label: 'Speaking blurb', rows: 4 },
  {
    kind: 'repeater',
    name: 'gallery',
    label: 'Gallery',
    itemNoun: 'image',
    max: 24,
    fields: [
      { kind: 'text', name: 'url', label: 'Address' },
      { kind: 'text', name: 'alt', label: 'Alt text' },
    ],
  },
  {
    kind: 'group',
    name: 'seo',
    label: 'Search and social',
    fields: [
      { kind: 'text', name: 'title', label: 'Title', maxLength: 70 },
      { kind: 'textarea', name: 'description', label: 'Description', rows: 3, maxLength: 200 },
      { kind: 'text', name: 'ogImageUrl', label: 'Share image', format: 'url' },
      { kind: 'text', name: 'ogImageAlt', label: 'Share image alt text' },
      { kind: 'boolean', name: 'noIndex', label: 'Hide from search engines' },
    ],
  },
];

export function AdminFounderPage() {
  const { hasPermission } = useAuth();
  const { notify } = useToast();
  const mayEdit = hasPermission('content:write');

  const state = useAsyncData<Record<string, unknown>>(() => apiGet('/site/founder'), []);

  return (
    <>
      <Seo title="Founder" description="The founder's story, message, and speaking topics." noIndex />
      <AdminHeader
        eyebrow="Website"
        title="About the founder"
        intro="Why the movement exists, told in the founder's own terms. This is the page that has to convince someone the message is real."
        backTo={ROUTES.adminH2C}
        backLabel="Movement content"
      />

      {state.error && <Alert title={state.offline ? 'API unreachable' : 'Could not load'}>{state.error}</Alert>}

      <Card style={{ maxWidth: 940 }}>
      {state.loading ? (
        <div style={{ display: 'grid', gap: 18 }}>
          {[0, 1, 2, 3].map((row) => (
            <div key={row} style={{ display: 'grid', gap: 6 }}>
              <Skeleton height={11} width={110} />
              <Skeleton height={36} />
            </div>
          ))}
        </div>
      ) : (
        <RecordForm
          fields={FIELDS}
          record={state.data}
          submitLabel="Save founder profile"
          disabled={!mayEdit}
          onSubmit={async (payload) => {
            await apiPatch('/site/founder', payload);
            notify('Founder profile saved.');
            state.reload();
          }}
        />
      )}
      </Card>
    </>
  );
}
