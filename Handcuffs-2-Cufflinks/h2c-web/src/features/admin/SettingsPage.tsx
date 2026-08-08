import { Seo } from '@/lib/seo/Seo';
import { apiGet, apiPatch } from '@/lib/api/client';
import { useAuth } from '@/providers/context/auth';
import { useToast } from '@/providers/context/toast';
import { ROUTES } from '@/router/routes';
import { AdminHeader, Alert } from './components/Chrome';
import { RecordForm } from './components/RecordForm';
import type { Field } from './lib/fields';
import { useAsyncData } from './lib/useAsyncData';

/**
 * Site settings.
 *
 * Structural rather than editorial, so it sits behind `settings:manage` — the
 * guide gives VAs publishing rights, not the ability to change the brand name
 * or put the whole site into maintenance mode.
 */
const FIELDS: Field[] = [
  { kind: 'text', name: 'brandName', label: 'Brand name', half: true },
  { kind: 'text', name: 'tagline', label: 'Tagline', half: true, hint: 'From Struggle to Success.' },
  { kind: 'text', name: 'creed', label: 'Creed', half: true },
  { kind: 'text', name: 'legacyLine', label: 'Legacy line', half: true },
  { kind: 'text', name: 'location', label: 'Location', half: true },
  { kind: 'textarea', name: 'missionStatement', label: 'Mission', rows: 5 },
  { kind: 'textarea', name: 'visionStatement', label: 'Vision', rows: 5 },
  {
    kind: 'repeater',
    name: 'socialLinks',
    label: 'Social platforms',
    itemNoun: 'platform',
    fields: [
      {
        kind: 'select',
        name: 'platform',
        label: 'Platform',
        half: true,
        options: [
          { value: 'youtube', label: 'YouTube' },
          { value: 'instagram', label: 'Instagram' },
          { value: 'facebook', label: 'Facebook' },
          { value: 'tiktok', label: 'TikTok' },
          { value: 'x', label: 'X' },
          { value: 'linkedin', label: 'LinkedIn' },
          { value: 'spotify', label: 'Spotify' },
          { value: 'apple-music', label: 'Apple Music' },
          { value: 'other', label: 'Other' },
        ],
      },
      { kind: 'number', name: 'displayOrder', label: 'Order', half: true },
      { kind: 'text', name: 'label', label: 'Label', half: true },
      { kind: 'text', name: 'url', label: 'Address', format: 'url', half: true },
    ],
  },
  {
    kind: 'group',
    name: 'contact',
    label: 'Contact',
    hint: 'The three email addresses are public. Phone and mailing address are not published.',
    fields: [
      { kind: 'text', name: 'generalEmail', label: 'General', format: 'email', half: true },
      { kind: 'text', name: 'pressEmail', label: 'Press', format: 'email', half: true },
      { kind: 'text', name: 'bookingEmail', label: 'Speaking and booking', format: 'email', half: true },
      { kind: 'text', name: 'phone', label: 'Phone (internal)', half: true },
      { kind: 'textarea', name: 'mailingAddress', label: 'Mailing address (internal)', rows: 3 },
    ],
  },
  {
    kind: 'group',
    name: 'defaultSeo',
    label: 'Default search metadata',
    hint: 'Used by any route without its own override.',
    fields: [
      { kind: 'text', name: 'title', label: 'Title', maxLength: 70 },
      { kind: 'textarea', name: 'description', label: 'Description', rows: 3, maxLength: 200 },
      { kind: 'tags', name: 'keywords', label: 'Keywords' },
      { kind: 'text', name: 'ogImageUrl', label: 'Share image', format: 'url' },
      { kind: 'text', name: 'ogImageAlt', label: 'Share image alt text' },
      { kind: 'boolean', name: 'noIndex', label: 'Hide the whole site from search engines' },
    ],
  },
  { kind: 'boolean', name: 'smsSignupEnabled', label: 'Offer SMS on the Join form' },
  {
    kind: 'boolean',
    name: 'commerceEnabled',
    label: 'Enable purchasing',
    hint: 'Showcase mode is the approved default. Do not turn this on without the client.',
  },
  { kind: 'boolean', name: 'maintenanceMode', label: 'Maintenance mode' },
  { kind: 'text', name: 'maintenanceMessage', label: 'Maintenance message' },
];

export function AdminSettingsPage() {
  const { hasPermission } = useAuth();
  const { notify } = useToast();
  const mayEdit = hasPermission('settings:manage');

  const state = useAsyncData<Record<string, unknown>>(() => apiGet('/site/settings/admin'), []);

  return (
    <>
      <Seo title="Site settings" description="Brand copy, contact, and site-wide switches." noIndex />
      <AdminHeader
        eyebrow="Website"
        title="Site settings"
        intro="Brand copy, contact addresses, social platforms, and the switches that change every page at once."
        backTo={ROUTES.adminH2C}
        backLabel="Movement content"
      />

      {state.error && <Alert title={state.offline ? 'API unreachable' : 'Could not load'}>{state.error}</Alert>}
      {!mayEdit && (
        <Alert title="Read only">
          Settings change the shape of every page, so they are restricted to Super Administrators.
        </Alert>
      )}

      {state.loading ? (
        <p className="body body--quiet">Loading…</p>
      ) : (
        <RecordForm
          fields={FIELDS}
          record={state.data}
          submitLabel="Save settings"
          disabled={!mayEdit}
          onSubmit={async (payload) => {
            await apiPatch('/site/settings', payload);
            notify('Site settings saved.');
            state.reload();
          }}
        />
      )}
    </>
  );
}
