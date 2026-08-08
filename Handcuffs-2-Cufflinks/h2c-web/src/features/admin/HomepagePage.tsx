import { useState } from 'react';
import { Seo } from '@/lib/seo/Seo';
import { apiGet, apiPatch, apiPost } from '@/lib/api/client';
import { useAuth } from '@/providers/context/auth';
import { useToast } from '@/providers/context/toast';
import { ROUTES } from '@/router/routes';
import { AdminHeader, Alert, Skeleton } from './components/Chrome';
import { RecordForm } from './components/RecordForm';
import type { Field } from './lib/fields';
import { messageFor, useAsyncData } from './lib/useAsyncData';

/**
 * The homepage, section by section.
 *
 * The set of sections is closed: the guide specifies thirteen blocks in a fixed
 * order, and that order is a narrative arc rather than a list. So the CMS
 * controls each block's copy, whether it appears, and where it sits — not the
 * invention of new block types, which would need a component to render it.
 */

const SECTION_KEYS = [
  'hero',
  'trailer',
  'featured-apparel',
  'meaning',
  'looks',
  'docuseries',
  'podcast',
  'music',
  'gwop',
  'community-stories',
  'founder',
  'join',
  'social',
] as const;

const SECTION_LABEL: Record<string, string> = {
  hero: '1. Hero',
  trailer: '2. Cinematic movement trailer',
  'featured-apparel': '3. Featured apparel',
  meaning: '4. The meaning behind the name',
  looks: '5. The eight photoshoot looks',
  docuseries: '6. Featured docuseries episode',
  podcast: '7. Podcast highlights',
  music: '8. Music spotlight',
  gwop: '9. GWOP and the ecosystem',
  'community-stories': '10. Community stories',
  founder: '11. Founder message',
  join: '12. Join the Movement',
  social: '13. Social media',
};

interface Section {
  id: string;
  key: string;
  heading?: string;
  isEnabled: boolean;
  displayOrder: number;
}

const SECTION_FIELDS: Field[] = [
  { kind: 'text', name: 'eyebrow', label: 'Eyebrow', half: true },
  { kind: 'text', name: 'heading', label: 'Heading', half: true },
  { kind: 'text', name: 'subheading', label: 'Subheading' },
  { kind: 'textarea', name: 'body', label: 'Body', rows: 5 },
  {
    kind: 'number',
    name: 'itemLimit',
    label: 'How many records to show',
    half: true,
    min: 1,
    max: 24,
    hint: 'Ignored by blocks that do not pull from a feed.',
  },
  { kind: 'number', name: 'displayOrder', label: 'Position', half: true },
  { kind: 'tags', name: 'featuredIds', label: 'Pinned record ids', hint: 'Shown first, in this order.' },
  {
    kind: 'group',
    name: 'backgroundImage',
    label: 'Background image',
    fields: [
      { kind: 'text', name: 'url', label: 'Address' },
      { kind: 'text', name: 'alt', label: 'Alt text' },
    ],
  },
  {
    kind: 'repeater',
    name: 'ctas',
    label: 'Buttons',
    itemNoun: 'button',
    max: 3,
    fields: [
      { kind: 'text', name: 'label', label: 'Button text', half: true },
      { kind: 'text', name: 'href', label: 'Links to', half: true },
      {
        kind: 'select',
        name: 'variant',
        label: 'Style',
        half: true,
        options: [
          { value: 'gold', label: 'Gold — primary' },
          { value: 'ghost', label: 'Ghost — secondary' },
          { value: 'text', label: 'Text only' },
        ],
      },
      { kind: 'boolean', name: 'isPrimaryAction', label: 'This is the primary action' },
    ],
  },
  { kind: 'boolean', name: 'isEnabled', label: 'Show this section' },
];

export function AdminHomepagePage() {
  const { hasPermission } = useAuth();
  const { notify } = useToast();

  const mayEditCopy = hasPermission('content:write');
  const mayEditStructure = hasPermission('settings:manage');

  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const state = useAsyncData<Section[]>(() => apiGet<Section[]>('/site/homepage/admin'), []);
  const sections = state.data ?? [];
  const present = new Set(sections.map((section) => section.key));
  const missing = SECTION_KEYS.filter((key) => !present.has(key));

  async function run(work: () => Promise<unknown>, done: string): Promise<void> {
    setBusy(true);
    setActionError(null);
    try {
      await work();
      notify(done);
      state.reload();
    } catch (caught) {
      setActionError(messageFor(caught));
    } finally {
      setBusy(false);
    }
  }

  function move(index: number, direction: -1 | 1): void {
    const next = [...sections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];

    void run(
      () =>
        apiPatch('/site/homepage/reorder', {
          order: next.map((section, position) => ({ id: section.id, displayOrder: position })),
        }),
      'Homepage order saved.'
    );
  }

  return (
    <>
      <Seo title="Homepage sections" description="The order and copy of the homepage." noIndex />
      <AdminHeader
        eyebrow="Website"
        title="Homepage sections"
        intro="The thirteen blocks in the order visitors meet them. Hiding a section keeps its copy — a seasonal block can come back without being retyped."
        backTo={ROUTES.adminH2C}
        backLabel="Movement content"
      />

      {actionError && <Alert title="That did not go through">{actionError}</Alert>}
      {state.error && <Alert title={state.offline ? 'API unreachable' : 'Could not load'}>{state.error}</Alert>}

      {missing.length > 0 && mayEditStructure && (
        <div className="adm-note adm-note--info" style={{ display: 'block' }}>
          <p className="adm-hint" style={{ marginBottom: 10 }}>
            {missing.length} section{missing.length === 1 ? '' : 's'} from the guide {missing.length === 1 ? 'has' : 'have'} no
            record yet. Create them to make their copy editable.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {missing.map((key) => (
              <button
                key={key}
                type="button"
                className="adm-btn adm-btn--sm"
                disabled={busy}
                onClick={() =>
                  void run(
                    () => apiPost('/site/homepage', { key, displayOrder: SECTION_KEYS.indexOf(key) }),
                    `Added the ${SECTION_LABEL[key]} section.`
                  )
                }
              >
                Add {SECTION_LABEL[key]}
              </button>
            ))}
          </div>
        </div>
      )}

      {state.loading && (
        <div style={{ display: 'grid', gap: 12 }}>
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} height={72} />
          ))}
        </div>
      )}

      <div className="adm-rep">
        {sections.map((section, index) => (
          <div className="adm-repitem" key={section.id}>
            <div className="adm-rephead">
              <div>
                <span className="adm-repnum">{SECTION_LABEL[section.key] ?? section.key}</span>
                {!section.isEnabled && (
                  <span className="adm-pill adm-pill--mute" style={{ marginLeft: 10 }}>
                    Hidden
                  </span>
                )}
                {section.heading && (
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>{section.heading}</p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {mayEditStructure && (
                  <>
                    <button
                      type="button"
                      className="adm-btn adm-btn--sm"
                      disabled={busy || index === 0}
                      onClick={() => move(index, -1)}
                      aria-label={`Move ${section.key} earlier`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="adm-btn adm-btn--sm"
                      disabled={busy || index === sections.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label={`Move ${section.key} later`}
                    >
                      ↓
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="adm-btn adm-btn--sm"
                  onClick={() => setOpenId(openId === section.id ? null : section.id)}
                >
                  {openId === section.id ? 'Close' : 'Edit copy'}
                </button>
              </div>
            </div>

            {openId === section.id && (
              <RecordForm
                fields={SECTION_FIELDS}
                record={section}
                submitLabel="Save section"
                disabled={!mayEditCopy}
                onSubmit={async (payload) => {
                  await apiPatch(`/site/homepage/${section.id}`, payload);
                  notify('Section saved.');
                  state.reload();
                }}
              />
            )}
          </div>
        ))}
      </div>

      {!state.loading && sections.length === 0 && !state.error && (
        <div className="adm-empty">
          No homepage sections yet.{' '}
          {mayEditStructure ? 'Add them from the list above.' : 'A Super Administrator needs to add them.'}
        </div>
      )}

      {sections.length > 0 && !mayEditStructure && (
        <p className="adm-hint" style={{ marginTop: 14 }}>
          Reordering the homepage changes every visitor’s first impression, so it is restricted to Super
          Administrators. You can still edit each section’s copy.
        </p>
      )}

      <div style={{ marginTop: 24 }}>
        <button type="button" className="adm-btn adm-btn--sm" onClick={() => state.reload()} disabled={busy}>Refresh</button>
      </div>
    </>
  );
}
