import { blankValues } from '../lib/fields';
import type { Field, Path, Values } from '../lib/fields';
import { Glyph } from './Glyph';

/**
 * Renders one field descriptor.
 *
 * Field-level errors are addressed by the same dot path the API uses when it
 * rejects a body (`images.0.url`), so a validation failure lands on the control
 * that caused it rather than in a paragraph at the top of a long form.
 */

interface ControlProps {
  field: Field;
  path: Path;
  values: Values;
  errors: Record<string, string[]>;
  onChange: (path: Path, value: unknown) => void;
  disabled?: boolean;
}

function pathKey(path: Path): string {
  return path.join('.');
}

export function FieldControl({ field, path, values, errors, onChange, disabled }: ControlProps) {
  const here: Path = [...path, field.name];
  const value = values[field.name];
  const problems = errors[pathKey(here)] ?? [];
  const id = `f-${pathKey(here).replace(/\./g, '-')}`;

  if (field.kind === 'group') {
    return (
      <fieldset className={`adm-group ${field.half ? '' : 'adm-full'}`}>
        <legend>{field.label}</legend>
        {field.hint && <span className="adm-hint">{field.hint}</span>}
        <FieldSet
          fields={field.fields}
          path={here}
          values={(value ?? {}) as Values}
          errors={errors}
          onChange={onChange}
          disabled={disabled}
        />
      </fieldset>
    );
  }

  if (field.kind === 'repeater') {
    const rows = Array.isArray(value) ? (value as Values[]) : [];
    const atMax = field.max !== undefined && rows.length >= field.max;

    return (
      <div className="adm-full" style={{ display: 'grid', gap: 10 }}>
        <div>
          <span className="adm-grouptitle" style={{ padding: 0, display: 'block' }}>
            {field.label}
          </span>
          {field.hint && <span className="adm-hint">{field.hint}</span>}
        </div>

        <div className="adm-rep">
          {rows.map((row, index) => (
            <div className="adm-repitem" key={index}>
              <div className="adm-rephead">
                <span className="adm-repnum">
                  {field.itemNoun} {index + 1}
                </span>
                <button
                  type="button"
                  className="adm-btn adm-btn--sm adm-btn--danger"
                  disabled={disabled}
                  onClick={() => onChange(here, rows.filter((_unused, position) => position !== index))}
                >
                  <Glyph name="trash" />
                  Remove
                </button>
              </div>
              <FieldSet
                fields={field.fields}
                path={[...here, index]}
                values={row}
                errors={errors}
                onChange={onChange}
                disabled={disabled}
              />
            </div>
          ))}

          {rows.length === 0 && (
            <p className="adm-hint" style={{ margin: 0 }}>
              None yet.
            </p>
          )}

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              type="button"
              className="adm-btn adm-btn--sm"
              disabled={disabled || atMax}
              onClick={() => onChange(here, [...rows, blankValues(field.fields)])}
            >
              <Glyph name="plus" />
              Add {field.itemNoun}
            </button>
            {atMax && <span className="adm-hint">Maximum of {field.max}.</span>}
          </div>
        </div>

        {problems.length > 0 && <span className="adm-err">{problems.join(' ')}</span>}
      </div>
    );
  }

  const wrapper = ['adm-field', field.half ? '' : 'adm-full', problems.length > 0 ? 'adm-field-bad' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapper}>
      <label htmlFor={id}>
        {field.label}
        {'required' in field && field.required ? <span className="adm-req"> *</span> : null}
      </label>

      {renderControl(field, id, value, (next) => onChange(here, next), disabled)}

      {field.hint && field.kind !== 'boolean' && <span className="adm-hint">{field.hint}</span>}
      {problems.length > 0 && <span className="adm-err">{problems.join(' ')}</span>}
    </div>
  );
}

function renderControl(
  field: Field,
  id: string,
  value: unknown,
  set: (next: unknown) => void,
  disabled?: boolean
) {
  switch (field.kind) {
    case 'textarea':
      return (
        <textarea
          id={id}
          rows={field.rows ?? 5}
          maxLength={field.maxLength}
          disabled={disabled}
          value={String(value ?? '')}
          onChange={(event) => set(event.target.value)}
        />
      );

    case 'number':
      return (
        <input
          id={id}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          disabled={disabled}
          value={String(value ?? '')}
          onChange={(event) => set(event.target.value)}
        />
      );

    case 'boolean':
      return (
        <label className="adm-check">
          <input
            id={id}
            type="checkbox"
            disabled={disabled}
            checked={Boolean(value)}
            onChange={(event) => set(event.target.checked)}
          />
          <span>{field.hint ?? 'Yes'}</span>
        </label>
      );

    case 'select':
      return (
        <select
          id={id}
          disabled={disabled}
          value={String(value ?? '')}
          onChange={(event) => set(event.target.value)}
        >
          <option value="">Not set</option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case 'date':
      return (
        <input
          id={id}
          type={field.withTime ? 'datetime-local' : 'date'}
          disabled={disabled}
          value={String(value ?? '')}
          onChange={(event) => set(event.target.value)}
        />
      );

    case 'tags': {
      // One per line rather than comma-separated: the values here are lesson
      // statements and care instructions, which contain commas of their own.
      const lines = Array.isArray(value) ? (value as string[]) : [];
      return (
        <textarea
          id={id}
          rows={Math.min(Math.max(lines.length + 1, 3), 10)}
          disabled={disabled}
          value={lines.join('\n')}
          onChange={(event) => set(event.target.value.split('\n'))}
          onBlur={(event) =>
            set(
              event.target.value
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
            )
          }
        />
      );
    }

    default:
      return (
        <input
          id={id}
          type={field.kind === 'text' && field.format === 'email' ? 'email' : 'text'}
          placeholder={field.kind === 'text' ? field.placeholder : undefined}
          maxLength={field.kind === 'text' ? field.maxLength : undefined}
          disabled={disabled}
          value={String(value ?? '')}
          onChange={(event) => set(event.target.value)}
        />
      );
  }
}

/** Lays a list of fields out, pairing consecutive half-width controls. */
export function FieldSet({
  fields,
  path,
  values,
  errors,
  onChange,
  disabled,
}: {
  fields: Field[];
  path: Path;
  values: Values;
  errors: Record<string, string[]>;
  onChange: (path: Path, value: unknown) => void;
  disabled?: boolean;
}) {
  return (
    <div className="adm-row">
      {fields.map((field) => (
        <FieldControl
          key={field.name}
          field={field}
          path={path}
          values={values}
          errors={errors}
          onChange={onChange}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
