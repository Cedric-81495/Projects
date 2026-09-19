import { NextResponse } from 'next/server';
import { paramsFromSearchParams, searchJobs } from '@/lib/search/query';

export const dynamic = 'force-dynamic';

/**
 * GET /api/jobs?q=&location=&type=&arrangement=&posted=&salaryMin=&sort=&page=
 * The same search path the pages use, exposed as JSON.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  try {
    const result = await searchJobs(paramsFromSearchParams(url.searchParams));
    return NextResponse.json(result, {
      headers: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Search failed', detail: (error as Error).message }, { status: 500 },
    );
  }
}
