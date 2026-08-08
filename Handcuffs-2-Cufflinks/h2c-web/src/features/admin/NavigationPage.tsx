import { useState } from 'react';
import { Seo } from '@/lib/seo/Seo';
import { apiGet, apiPut } from '@/lib/api/client';
import { useAuth } from '@/providers/context/auth';
import { useToast } from '@/providers/context/toast';
import { ROUTES } from '@/router/routes';
import { AdminHeader, Alert, Card, Skeleton } from './components/Chrome';
import { RecordForm } from './components/RecordForm';
import type { Field } from './lib/fields';
import { useAsyncData } from './lib/useAsyncData';

/**
 * Navigation menus.
 *
 * Edited as a whole list rather than item by item, matching the API: merging a
 * partial items array into an existing one has no sensible meaning, and a menu
 * is read as a sequence anyway.
 *
 * The admin read is deliberately the unfiltered one. The public endpoints drop
 * hidden entries, and a CMS that could not see a hidden item would delete every
 * one of them the first time someone saved.
 */

const LOCATIONS = [
  { value: 'header', label: 'Header' },
  { value: 'mobile-drawer', label: 'Mobile drawer' },
  { value: 'footer-primary', label: 'Footer — primary' },
  { value: 'footer-secondary', label: 'Footer — secondary' },
  { value: 'legal', label: 'Legal' },
];

interface Menu {
  id: string;
  location: string;
  title?: string;
  items: unknown[];
}

const CHILD_FIELDS: Field[] = [
  { kind: 'text', name: 'label', label: 'Label', half: true },
  { kind: 'text', name: 'href', label: 'Links to', half: true, placeholder: '/collections' },
  { kind: 'text', name: 'description', label: 'Description' },
  { kind: 'number', name: 'displayOrder', label: 'Order', half: true },
  { kind: 'boolean', name: 'isExternal', label: 'Opens in a new tab', half: true },
  { kind: 'boolean', name: 'isVisible', label: 'Visible' },
];

const MENU_FIELDS: Field[] = [
  { kind: 'text', name: 'title', label: 'Menu title', half: true },
  {
    kind: 'repeater',
    name: 'items',
    label: 'Items',
    itemNoun: 'item',
    max: 24,
    fields: [
      { kind: 'text', name: 'label', label: 'Label', half: true },
      {
        kind: 'text',
        name: 'href',
        label: 'Links to',
        half: true,
        hint: 'A path starting with "/" or a full http(s) address. Leave blank if this item only holds children.',
      },
      {
        kind: 'select',
        name: 'emphasis',
        label: 'Emphasis',
        half: true,
        options: [
          { value: 'none', label: 'None' },
          { value: 'primary', label: 'Primary' },
          { value: 'muted', label: 'Muted' },
        ],
      },
      { kind: 'number', name: 'displayOrder', label: 'Order', half: true },
      { kind: 'boolean', name: 'isExternal', label: 'Opens in a new tab', half: true },
      { kind: 'boolean', name: 'isVisible', label: 'Visible', half: true },
      { kind: 'repeater', name: 'children', label: 'Sub-items', itemNoun: 'sub-item', max: 12, fields: CHILD_FIELDS },
    ],
  },
];

export function AdminNavigationPage() {
  const { hasPermission } = useAuth();
  const { notify } = useToast();
  const mayEdit = hasPermission('settings:manage');

  const [location, setLocation] = useState('header');

  const state = useAsyncData<Menu[]>(() => apiGet<Menu[]>('/site/navigation/admin/all'), []);
  const menu = state.data?.find((entry) => entry.location === location) ?? null;

  return (
    <>
      <Seo title="Navigation" description="Header, footer, drawer, and legal menus." noIndex />
      <AdminHeader
        eyebrow="Website"
        title="Navigation"
        intro="Five menus, each edited as a whole list. Links must be a path starting with a slash or a full http(s) address — anything else is refused at the API."
        backTo={ROUTES.adminH2C}
        backLabel="Movement content"
      />

      <div className="adm-tabs">
        {LOCATIONS.map((entry) => (
          <button
            key={entry.value}
            type="button"
            className={`adm-tab ${location === entry.value ? 'is-on' : ''}`}
            onClick={() => setLocation(entry.value)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {state.error && <Alert title={state.offline ? 'API unreachable' : 'Could not load'}>{state.error}</Alert>}
      {!mayEdit && (
        <Alert title="Read only">
          Navigation is site structure, so it is restricted to Super Administrators.
        </Alert>
      )}

      <Card style={{ maxWidth: 940 }}>
      {state.loading ? (
        <div style={{ display: 'grid', gap: 18 }}>
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} height={44} />
          ))}
        </div>
      ) : (
        <>
          {!menu && (
            <p className="adm-hint" style={{ marginBottom: 14 }}>
              This menu has not been set up yet. Saving creates it.
            </p>
          )}
          <RecordForm
            key={location}
            fields={MENU_FIELDS}
            record={menu ?? { title: '', items: [] }}
            submitLabel="Save menu"
            disabled={!mayEdit}
            onSubmit={async (payload) => {
              await apiPut(`/site/navigation/${location}`, payload);
              notify('Navigation saved.');
              state.reload();
            }}
          />
        </>
      )}
      </Card>
    </>
  );
}
