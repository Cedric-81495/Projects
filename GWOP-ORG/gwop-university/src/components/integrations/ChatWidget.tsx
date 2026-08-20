import Script from 'next/script'
import { headers } from 'next/headers'
import { CHAT_WIDGET_ID } from '@/config/integrations'

/**
 * JAKE'S GHL AI CHAT WIDGET.
 *
 * ⚠️ NEVER render this on /830, and never move it into a shared layout.
 *
 * CLAUDE.md invariant 7 keeps every third-party script off the event page. The
 * reason is physical: this widget mounts a floating button in the bottom-right
 * corner, which on a phone is exactly where the "Send my blueprint" button sits.
 * A lead lost to a chat bubble covering the submit control at a busy booth is
 * unrecoverable — the person has already walked away.
 *
 * It is therefore imported per-page rather than from a layout, so adding it
 * somewhere new is a deliberate act rather than something that happens by
 * inheritance.
 *
 * `afterInteractive` rather than `beforeInteractive`: the widget is support, not
 * content. It must never delay first paint or compete with the page's own
 * JavaScript, particularly on the slow connections this site is built for.
 *
 * ⚠️ THE NONCE IS REQUIRED, not optional.
 *
 * The applied CSP comes from middleware.ts, not next.config.ts — middleware runs
 * after and its header wins. That policy uses `strict-dynamic`, which makes the
 * browser IGNORE host allow-lists for scripts and trust only what a nonced
 * script loads. So without the nonce below this tag is blocked no matter how
 * many LeadConnector domains are allow-listed, and the only symptom is a console
 * error and no bubble.
 *
 * Middleware puts the per-request nonce on the `x-nonce` request header for
 * exactly this purpose. Reading headers() makes this an async server component,
 * which is why it is awaited at the call site.
 */
export async function ChatWidget() {
  if (!CHAT_WIDGET_ID) return null

  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <Script
      src="https://widgets.leadconnectorhq.com/loader.js"
      data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
      data-widget-id={CHAT_WIDGET_ID}
      nonce={nonce}
      strategy="afterInteractive"
    />
  )
}
