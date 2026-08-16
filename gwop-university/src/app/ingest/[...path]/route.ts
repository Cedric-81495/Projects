import { NextResponse, type NextRequest } from 'next/server'

/**
 * PostHog reverse proxy.
 *
 * Analytics are served from our own origin (`/ingest/*`) rather than
 * app.posthog.com. Two practical reasons: ad blockers drop requests to known
 * analytics domains — commonly 20–40% of traffic, and the missing slice is not
 * random — and a third-party connect-src entry is one more origin the CSP has
 * to trust.
 */
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const UPSTREAM = 'https://us.i.posthog.com'
const ASSETS = 'https://us-assets.i.posthog.com'

async function proxy(request: NextRequest, path: string[]) {
  const isAsset = path[0] === 'static'
  const base = isAsset ? ASSETS : UPSTREAM
  const target = `${base}/${path.join('/')}${request.nextUrl.search}`

  const headers = new Headers(request.headers)
  // Upstream must see its own host, not ours, or TLS and routing break.
  headers.set('host', new URL(base).host)
  // Never forward our session cookies to a third party.
  headers.delete('cookie')

  const res = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    // @ts-expect-error — required by undici for streaming request bodies
    duplex: 'half',
  })

  return new NextResponse(res.body, { status: res.status, headers: res.headers })
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await ctx.params).path)
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(request, (await ctx.params).path)
}
