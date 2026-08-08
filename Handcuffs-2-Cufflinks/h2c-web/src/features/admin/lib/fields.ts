/**
 * Field descriptors for the CMS.
 *
 * Every record type in the guide needs the same editing surface — a labelled
 * control, a hint, validation feedback, and a save. Thirteen hand-written forms
 * is thirteen places for a field to drift from the schema it posts to, and the
 * compiler cannot catch that. So a record's shape is declared once as data and
 * one renderer builds the form from it.
 *
 * Two composites, `group` and `repeater`, cover every nested shape the API
 * accepts: a media asset is a group, an image gallery is a repeater of that
 * group, production credits are a group of tag lists. Nothing else was needed,
 * which is a reasonable sign the abstraction is the right size.
 */

export interface FieldBase {
  /** Key within the parent object. */
  name: string;
  label: string;
  hint?: string;
  /** Render at half width so two controls share a row. */
  half?: boolean;
}

export interface TextField extends FieldBase {
  kind: 'text';
  /**
   * Formats other than `plain` and `slug` are omitted from the payload when
   * blank rather than sent as an empty string.
   *
   * The API validates them with `.url()`, `.email()`, a path refinement, or an
   * ObjectId regex — and every one of those rejects "". Sending the empty
   * string would tell an operator that the field they deliberately left alone
   * is a malformed address, which is both wrong and unactionable. Absence is
   * how you say "not set".
   */
  format?: 'plain' | 'slug' | 'url' | 'email' | 'path' | 'id';
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
}

export interface TextAreaField extends FieldBase {
  kind: 'textarea';
  rows?: number;
  maxLength?: number;
  required?: boolean;
}

export interface NumberField extends FieldBase {
  kind: 'number';
  min?: number;
  max?: number;
  step?: number;
}

export interface BooleanField extends FieldBase {
  kind: 'boolean';
}

export interface SelectField extends FieldBase {
  kind: 'select';
  options: { value: string; label: string }[];
  required?: boolean;
}

export interface DateField extends FieldBase {
  kind: 'date';
  withTime?: boolean;
  /** Cleared to null rather than omitted — for windows that mean "no end". */
  nullable?: boolean;
  required?: boolean;
}

/** A list of short strings, edited one per line. */
export interface TagsField extends FieldBase {
  kind: 'tags';
  max?: number;
}

export interface GroupField extends FieldBase {
  kind: 'group';
  fields: Field[];
}

export interface RepeaterField extends FieldBase {
  kind: 'repeater';
  fields: Field[];
  /** Singular noun for the add button, e.g. "image". */
  itemNoun: string;
  max?: number;
}

export type Field =
  | TextField
  | TextAreaField
  | NumberField
  | BooleanField
  | SelectField
  | DateField
  | TagsField
  | GroupField
  | RepeaterField;

export type Values = Record<string, unknown>;

/* ------------------------------------------------------------------ */
/* Reading and writing by path                                         */
/* ------------------------------------------------------------------ */

export type Path = (string | number)[];

/** Reads a nested value addressed the way list columns declare it: "engagement.likes". */
export function valueAt(source: unknown, dotted: string): unknown {
  return readAt(source, dotted.split('.'));
}

export function readAt(source: unknown, path: Path): unknown {
  return path.reduce<unknown>((node, key) => {
    if (node === null || node === undefined) return undefined;
    if (typeof key === 'number') return Array.isArray(node) ? node[key] : undefined;
    return typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined;
  }, source);
}

/**
 * Returns a copy of `source` with `path` set to `value`.
 *
 * Copies rather than mutates so React sees a new reference at every level it
 * renders from — an in-place edit of a nested repeater item is the classic way
 * a form stops re-rendering while the data underneath it is, in fact, changing.
 */
export function writeAt(source: unknown, path: Path, value: unknown): unknown {
  if (path.length === 0) return value;

  const [key, ...rest] = path;

  if (typeof key === 'number') {
    const list = Array.isArray(source) ? [...source] : [];
    list[key] = writeAt(list[key], rest, value);
    return list;
  }

  const object = { ...((source ?? {}) as Record<string, unknown>) };
  object[key] = writeAt(object[key], rest, value);
  return object;
}

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

function emptyValue(field: Field): unknown {
  switch (field.kind) {
    case 'boolean':
      return false;
    case 'number':
      return '';
    case 'tags':
      return [];
    case 'repeater':
      return [];
    case 'group':
      return blankValues(field.fields);
    case 'date':
      return '';
    default:
      return '';
  }
}

export function blankValues(fields: Field[]): Values {
  return Object.fromEntries(fields.map((field) => [field.name, emptyValue(field)]));
}

/**
 * Merges a record from the API into the shape the form expects.
 *
 * Missing keys become empty controls rather than `undefined`, which is what
 * keeps every input controlled — React warns loudly the first time an input
 * flips from uncontrolled to controlled, and it happens exactly when an
 * optional field is filled in for the first time.
 */
export function valuesFrom(fields: Field[], record: unknown): Values {
  const source = (record ?? {}) as Record<string, unknown>;

  return Object.fromEntries(
    fields.map((field) => {
      const raw = source[field.name];

      switch (field.kind) {
        case 'group':
          return [field.name, valuesFrom(field.fields, raw)];

        case 'repeater': {
          const list = Array.isArray(raw) ? raw : [];
          return [field.name, list.map((item) => valuesFrom(field.fields, item))];
        }

        case 'tags': {
          const list = Array.isArray(raw) ? raw : [];
          return [field.name, list.map((item) => String(item))];
        }

        case 'boolean':
          return [field.name, Boolean(raw)];

        case 'number':
          return [field.name, raw === null || raw === undefined ? '' : String(raw)];

        case 'date':
          return [field.name, toInputDate(raw, field.withTime ?? false)];

        default:
          return [field.name, raw === null || raw === undefined ? '' : String(raw)];
      }
    })
  );
}

/** ISO timestamp to the value an <input type="date|datetime-local"> expects. */
export function toInputDate(raw: unknown, withTime: boolean): string {
  if (!raw) return '';
  const date = new Date(String(raw));
  if (Number.isNaN(date.getTime())) return '';

  // Sliced from a local-time ISO string: toISOString() is UTC, and using it
  // would show a Manila editor an event starting eight hours before it does.
  const offsetMs = date.getTime() - date.getTimezoneOffset() * 60_000;
  const local = new Date(offsetMs).toISOString();
  return withTime ? local.slice(0, 16) : local.slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* Preparing the payload                                               */
/* ------------------------------------------------------------------ */

/**
 * Whether a prepared object carries anything the author actually entered.
 *
 * `false` counts as nothing, and that asymmetry is deliberate. Booleans arrive
 * with a default already set, so an untouched sub-form is full of `false` and
 * would look populated to a naive emptiness check — which is how a blank
 * call-to-action row reaches the API and fails on a missing label. A ticked box
 * is a decision, so `true` counts.
 */
function hasSubstance(payload: Record<string, unknown>): boolean {
  return Object.values(payload).some((value) => {
    if (value === false || value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return hasSubstance(value as Record<string, unknown>);
    return true;
  });
}

/**
 * Turns form state into the JSON body the API validates.
 *
 * The interesting case is the optional sub-object. A record with no cover image
 * holds `{ kind: '', url: '', alt: '' }` in the form, and posting that fails
 * validation on a URL that was never filled in. So a group whose every leaf is
 * blank is dropped entirely — which is also the only way to clear one.
 */
export function toPayload(fields: Field[], values: Values): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    const value = values[field.name];

    switch (field.kind) {
      case 'group': {
        const inner = toPayload(field.fields, (value ?? {}) as Values);
        if (hasSubstance(inner)) payload[field.name] = inner;
        break;
      }

      case 'repeater': {
        const list = Array.isArray(value) ? value : [];
        payload[field.name] = list
          .map((item) => toPayload(field.fields, (item ?? {}) as Values))
          .filter(hasSubstance);
        break;
      }

      case 'tags': {
        const list = Array.isArray(value) ? value : [];
        payload[field.name] = list.map((item) => String(item).trim()).filter(Boolean);
        break;
      }

      case 'boolean':
        payload[field.name] = Boolean(value);
        break;

      case 'number': {
        const text = String(value ?? '').trim();
        if (text === '') break;
        const parsed = Number(text);
        if (!Number.isNaN(parsed)) payload[field.name] = parsed;
        break;
      }

      case 'date': {
        const text = String(value ?? '').trim();
        if (text === '') {
          if (field.nullable) payload[field.name] = null;
          break;
        }
        payload[field.name] = new Date(text).toISOString();
        break;
      }

      case 'text': {
        const text = String(value ?? '').trim();
        // A blank optional link is absence, not an empty address.
        if (text === '' && field.format && field.format !== 'plain' && field.format !== 'slug') break;
        payload[field.name] = text;
        break;
      }

      case 'select': {
        const text = String(value ?? '').trim();
        if (text === '') break;
        payload[field.name] = text;
        break;
      }

      default: {
        const text = String(value ?? '');
        payload[field.name] = text;
      }
    }
  }

  return payload;
}
