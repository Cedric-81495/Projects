/**
 * Minimal class-name joiner.
 *
 * Deliberately not `clsx` — the whole need is filtering falsy values, and a
 * six-line helper avoids a dependency plus its bundle cost.
 */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}
