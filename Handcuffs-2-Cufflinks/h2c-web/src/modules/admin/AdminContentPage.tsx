import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Plus, Pencil, Trash2, X } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Button } from '@/components/ui/Button';
import { Field, TextInput, Textarea } from '@/components/ui/Field';
import { adminApi, type ContentDoc, type ContentResource } from '@/services/admin';
import { cn } from '@/lib/cn';

type FieldSpec = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'checkbox';
  required?: boolean;
};

const SPECS: Record<ContentResource, { title: string; fields: FieldSpec[]; primary: string; secondary: string }> = {
  stories: {
    title: 'Stories',
    primary: 'title',
    secondary: 'guest',
    fields: [
      { key: 'slug', label: 'Slug (unique id)', type: 'text', required: true },
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'guest', label: 'Guest', type: 'text', required: true },
      { key: 'chapter', label: 'Chapter', type: 'text', required: true },
      { key: 'duration', label: 'Duration', type: 'text', required: true },
      { key: 'blurb', label: 'Blurb', type: 'textarea', required: true },
      { key: 'order', label: 'Order', type: 'number' },
      { key: 'published', label: 'Published', type: 'checkbox' },
    ],
  },
  episodes: {
    title: 'Podcast episodes',
    primary: 'title',
    secondary: 'guest',
    fields: [
      { key: 'slug', label: 'Slug (unique id)', type: 'text', required: true },
      { key: 'number', label: 'Number', type: 'text', required: true },
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'guest', label: 'Guest', type: 'text', required: true },
      { key: 'duration', label: 'Duration', type: 'text', required: true },
      { key: 'order', label: 'Order', type: 'number' },
      { key: 'published', label: 'Published', type: 'checkbox' },
    ],
  },
  tracks: {
    title: 'Music tracks',
    primary: 'title',
    secondary: 'artist',
    fields: [
      { key: 'slug', label: 'Slug (unique id)', type: 'text', required: true },
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'artist', label: 'Artist', type: 'text', required: true },
      { key: 'length', label: 'Length', type: 'text', required: true },
      { key: 'order', label: 'Order', type: 'number' },
      { key: 'published', label: 'Published', type: 'checkbox' },
    ],
  },
};

function blankForm(fields: FieldSpec[]): Record<string, string | boolean> {
  const f: Record<string, string | boolean> = {};
  for (const field of fields) f[field.key] = field.type === 'checkbox' ? true : '';
  return f;
}

export function AdminContentPage() {
  const params = useParams();
  const resource = (params.resource as ContentResource) ?? 'stories';
  const spec = SPECS[resource] ?? SPECS.stories;

  const [items, setItems] = useState<ContentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>(() => blankForm(spec.fields));
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async (r: ContentResource) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await adminApi.listContent(r);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setOpen(false);
    setEditingId(null);
    setForm(blankForm(SPECS[resource]?.fields ?? SPECS.stories.fields));
    void load(resource);
  }, [resource, load]);

  const fields = useMemo(() => spec.fields, [spec]);

  function startCreate() {
    setEditingId(null);
    setForm(blankForm(fields));
    setOpen(true);
  }

  function startEdit(item: ContentDoc) {
    const f: Record<string, string | boolean> = {};
    for (const field of fields) {
      const v = item[field.key];
      f[field.key] = field.type === 'checkbox' ? Boolean(v ?? true) : v == null ? '' : String(v);
    }
    setForm(f);
    setEditingId(item._id);
    setOpen(true);
  }

  function buildPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
      const val = form[field.key];
      if (field.type === 'number') {
        if (val !== '' && val != null) payload[field.key] = Number(val);
      } else if (field.type === 'checkbox') {
        payload[field.key] = Boolean(val);
      } else {
        payload[field.key] = String(val ?? '').trim();
      }
    }
    return payload;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload();
      if (editingId) await adminApi.updateContent(resource, editingId, payload);
      else await adminApi.createContent(resource, payload);
      setOpen(false);
      await load(resource);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this item? This cannot be undone.')) return;
    try {
      await adminApi.deleteContent(resource, id);
      setItems((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  }

  return (
    <section className="min-h-[80vh] bg-ink py-16">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Content</Eyebrow>
            <h1 className="mt-4 font-display text-display-md font-semibold text-bone">{spec.title}</h1>
          </div>
          <Button variant="gold" onClick={startCreate}>
            <Plus size={16} /> New
          </Button>
        </div>

        {error && (
          <p className="mt-6 rounded-xl border border-red-500/40 bg-red-500/5 p-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        {open && (
          <form onSubmit={save} className="mt-8 rounded-2xl border border-gold/30 bg-onyx p-6" noValidate>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-bone">
                {editingId ? 'Edit item' : 'New item'}
              </h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-muted hover:text-bone">
                <X size={18} />
              </button>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                  {field.type === 'checkbox' ? (
                    <label className="flex items-center gap-3 text-sm text-bone">
                      <input
                        type="checkbox"
                        checked={Boolean(form[field.key])}
                        onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.checked }))}
                        className="h-4 w-4 accent-gold"
                      />
                      {field.label}
                    </label>
                  ) : (
                    <Field label={field.label} htmlFor={`f-${field.key}`}>
                      {field.type === 'textarea' ? (
                        <Textarea
                          id={`f-${field.key}`}
                          rows={4}
                          required={field.required}
                          value={String(form[field.key] ?? '')}
                          onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                        />
                      ) : (
                        <TextInput
                          id={`f-${field.key}`}
                          type={field.type === 'number' ? 'number' : 'text'}
                          required={field.required}
                          value={String(form[field.key] ?? '')}
                          onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                        />
                      )}
                    </Field>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Button type="submit" variant="gold" disabled={saving}>
                {saving ? 'Saving\u2026' : editingId ? 'Save changes' : 'Create'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="mt-8">
          {loading ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="animate-spin text-gold" size={26} />
            </div>
          ) : items.length === 0 ? (
            <p className="py-16 text-center text-muted">No {resource} yet. Create the first one.</p>
          ) : (
            <ul className="divide-y divide-faint/20 overflow-hidden rounded-2xl border border-faint/30 bg-onyx">
              {items.map((item) => (
                <li key={item._id} className="flex items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-bone">
                      {String(item[spec.primary] ?? item.slug)}
                      {item.published === false && (
                        <span className="ml-2 rounded-full bg-faint/20 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-eyebrow text-faint">
                          draft
                        </span>
                      )}
                    </p>
                    <p className="truncate font-mono text-xs text-faint">
                      {item.slug} · {String(item[spec.secondary] ?? '')}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      aria-label="Edit"
                      className={cn('grid h-9 w-9 place-items-center rounded-full border border-faint/50 text-muted transition hover:border-gold hover:text-gold')}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item._id)}
                      aria-label="Delete"
                      className="grid h-9 w-9 place-items-center rounded-full border border-faint/50 text-muted transition hover:border-red-500/60 hover:text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
    </section>
  );
}
