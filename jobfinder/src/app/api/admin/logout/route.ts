import { NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

function clearedResponse(response: NextResponse): NextResponse {
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}

/**
 * The sign-out control is a plain form, so this has to answer with a
 * redirect rather than JSON — otherwise the browser navigates to the JSON
 * body. 303 turns the POST into a GET of /admin, which renders the sign-in
 * form now that the cookie is gone.
 *
 * A fetch() caller that asks for JSON still gets JSON, so scripts are unaffected.
 */
export async function POST(request: Request) {
  const wantsJson = request.headers.get('accept')?.includes('application/json');

  if (wantsJson) {
    return clearedResponse(NextResponse.json({ ok: true }));
  }

  return clearedResponse(
    NextResponse.redirect(new URL('/admin', request.url), 303),
  );
}
