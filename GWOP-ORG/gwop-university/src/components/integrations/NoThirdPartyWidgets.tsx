'use client'

import { useEffect } from 'react'

/**
 * BELT AND BRACES FOR /830.
 *
 * The links into this page are plain <a> tags so it always loads fresh, which is
 * the real fix. This is the second line of defence for anything that reaches it
 * client-side anyway — a browser back button, a future <Link> someone adds
 * without knowing why it matters, a redirect.
 *
 * Third-party widgets inject into document.body, outside React's tree, so
 * unmounting the component that loaded them removes nothing. This sweeps them
 * off the page directly.
 *
 * Why it matters more than tidiness: the chat widget ships its own copy of
 * Cloudflare Turnstile. When both load, the second bails with "Turnstile already
 * has been loaded", our challenge never renders, and every submission returns
 * 422 — the attendee sees "Some fields need attention" with no field to fix and
 * no way through. A silent, total loss of signups at the one event we get.
 *
 * Runs once on mount. Deliberately not a MutationObserver: a permanent observer
 * on the booth page is a cost paid on every device all afternoon to guard
 * against something the <a> tags already prevent.
 */
export function NoThirdPartyWidgets() {
  useEffect(() => {
    /* Selectors are broad on purpose. LeadConnector has changed its container
       markup before, and a missed element here means a bubble over the submit
       button rather than a caught error. */
    const SELECTORS = [
      '[id*="lc_text-widget"]',
      '[class*="lc_text-widget"]',
      '[id*="chat-widget"]',
      '[class*="chat-widget"]',
      'iframe[src*="leadconnectorhq"]',
      'script[src*="leadconnectorhq"]',
      'script[src*="msgsndr"]',
    ]

    for (const sel of SELECTORS) {
      document.querySelectorAll(sel).forEach(el => el.remove())
    }
  }, [])

  return null
}
