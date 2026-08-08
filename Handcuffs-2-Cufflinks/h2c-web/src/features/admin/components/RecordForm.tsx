import { useCallback, useMemo, useState } from 'react';
import { toPayload, valuesFrom, writeAt } from '../lib/fields';
import type { Field, Path, Values } from '../lib/fields';
import { fieldErrorsFor, messageFor } from '../lib/useAsyncData';
import { Note } from './Chrome';
import { FieldSet } from './FieldControl';
import { Glyph } from './Glyph';

/**
 * The form every record is edited through.
 *
 * State is a plain object updated by path rather than React Hook Form. The
 * stack calls for RHF "where applicable", and this is where it stops applying:
 * the field list is data, not JSX, so every name would be a dynamic string that
 * RHF's typed paths cannot check anyway — the type safety it exists to give
 * would be cast away at the only place it mattered. Thirty lines of immutable
 * path updates keeps the descriptors typed end to end instead.
 */
export function RecordForm({
  fields,
  record,
  submitLabel,
  onSubmit,
  disabled,
  extraActions,
}: {
  fields: Field[];
  /** The record being edited, or null when creating. */
  record: unknown;
  submitLabel: string;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  disabled?: boolean;
  extraActions?: React.ReactNode;
}) {
  const initial = useMemo(() => valuesFrom(fields, record), [fields, record]);

  const [values, setValues] = useState<Values>(initial);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Re-seeds when a different record arrives — the same form component is
  // reused across ids, and without this an edit screen would keep the previous
  // record's values after navigation.
  const [seed, setSeed] = useState(initial);
  if (seed !== initial) {
    setSeed(initial);
    setValues(initial);
    setErrors({});
    setFailure(null);
    setDirty(false);
  }

  const change = useCallback((path: Path, value: unknown) => {
    setValues((current) => writeAt(current, path, value) as Values);
    setDirty(true);
  }, []);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setFailure(null);

    try {
      await onSubmit(toPayload(fields, values));
      setDirty(false);
    } catch (caught) {
      setErrors(fieldErrorsFor(caught));
      setFailure(messageFor(caught));
    } finally {
      setSaving(false);
    }
  }

  const general = errors._ ?? [];

  return (
    <form className="adm-form" onSubmit={(event) => void submit(event)} noValidate>
      {failure && (
        <Note title="Not saved" tone="bad">
          {failure}
          {general.length > 0 && ` ${general.join(' ')}`}
        </Note>
      )}

      <FieldSet
        fields={fields}
        path={[]}
        values={values}
        errors={errors}
        onChange={change}
        disabled={disabled || saving}
      />

      <div className="adm-save">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={disabled || saving}>
          <Glyph name="check" />
          {saving ? 'Saving' : submitLabel}
        </button>
        {extraActions}
        {dirty && !saving && (
          <span className="adm-hint" role="status">
            Unsaved changes.
          </span>
        )}
      </div>
    </form>
  );
}
