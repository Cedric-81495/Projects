/**
 * Open-redirect guard.
 *
 * `?next=` comes from the URL, which means it is attacker-controlled: a
 * phishing link can send someone to /login?next=https://evil.example and, if
 * the value is used unchecked, our own domain performs the redirect after they
 * authenticate. That is a classic open redirect and it is trivially exploitable.
 *
 * Only same-site absolute paths survive. Protocol-relative URLs (`//evil.com`)
 * and backslash variants are rejected explicitly — they are the two that slip
 * past a naive `startsWith('/')` check.
 */
export function safeNext(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (!raw) return fallback
  if (!raw.startsWith('/')) return fallback
  if (raw.startsWith('//') || raw.startsWith('/\\')) return fallback
  if (raw.includes('://')) return fallback
  return raw
}
