// Small text helpers shared across the app.

/** Titles in the data may embed <br>; flatten for aria / plain contexts. */
export const plain = (s: string): string => s.replace(/<br\s*\/?>/gi, ' ');

/** Turn any string into a stable slug (used as a fallback id/key). */
export const slug = (s: string): string =>
  plain(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
