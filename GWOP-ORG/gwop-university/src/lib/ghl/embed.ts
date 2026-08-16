import { GHL_FORM_URL, QR_CODES, CAMPAIGN_PARAMS } from '@/config/integrations'

/**
 * Builds the GoHighLevel embed URL with attribution parameters (§10).
 *
 * Pure, synchronous, no network, no side effects — so it is unit-testable
 * without a browser, which matters because a wrong `s` value at the booth is
 * invisible until the attribution report is empty a week later.
 *
 * SECURITY: the parameter set is an ALLOW-LIST. A scanned URL is attacker-
 * controlled input — anyone can print their own QR pointing at our domain.
 * Forwarding arbitrary `?field=value` into Jake's form would let a stranger
 * inject values into his CRM. Only the keys below travel, and every value is
 * length-capped, because a pasted novel is not attribution.
 */

export const GHL_EMBED_MODE: 'iframe' | 'script' =
  (process.env.NEXT_PUBLIC_GHL_EMBED_MODE as 'iframe' | 'script') ?? 'iframe'

const MAX_VALUE_LENGTH = 120

/** Known QR staff codes. An unrecognised `s` is normalised, never forwarded raw. */
function normalizeSource(raw: string | null): string {
  if (!raw) return 'direct'
  const known = Object.values(QR_CODES) as readonly string[]
  if (known.includes(raw)) return raw
  return raw === 'unknown' ? 'unknown' : 'direct'
}

export interface EmbedOptions {
  interest?: string
  interestTag?: string
  /** The host page's `window.location.search`. */
  search?: string
}

export function buildGhlEmbedUrl({ interest, interestTag, search = '' }: EmbedOptions): string | null {
  if (!GHL_FORM_URL) return null

  let url: URL
  try {
    url = new URL(GHL_FORM_URL)
  } catch {
    // Malformed env value. Return null so the placeholder renders instead of
    // shipping a broken iframe to a live booth.
    return null
  }

  const incoming = new URLSearchParams(search)

  if (interest) url.searchParams.set('interest', interest.slice(0, MAX_VALUE_LENGTH))

  // Jake's exact tag text travels with the lead so his workflow matches on it
  // directly, rather than through a lookup table that has to stay in sync in
  // two systems. Do not "tidy" either string.
  if (interestTag) url.searchParams.set('interest_tag', interestTag.slice(0, MAX_VALUE_LENGTH))

  url.searchParams.set('s', normalizeSource(incoming.get('s')))

  for (const key of CAMPAIGN_PARAMS) {
    const value = incoming.get(key)
    if (value) url.searchParams.set(key, value.slice(0, MAX_VALUE_LENGTH))
  }

  return url.toString()
}

/**
 * ⚠ DOCUMENTED LIMITATION (§10).
 *
 * Whether GHL prefills from `?interest=` depends on how Jake built the field —
 * it is not guaranteed by the platform. If it does not work, in order of
 * preference:
 *
 *   1. Jake adds a hidden field bound to the query parameter. His side, minutes
 *      of work, and the cleanest outcome.
 *   2. One embed URL per interest, selected here instead of a query parameter.
 *   3. Drop the parameter and let the attendee choose inside his form.
 *
 * We do NOT compensate by storing the lead ourselves. That is the second lead
 * database §4 forbids, and it needs explicit team approval, not a workaround.
 */
