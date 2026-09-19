import { NextResponse } from 'next/server';
import { publicClient } from '@/lib/db/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = publicClient();
  const { data, error } = await db
    .from('jobs')
    .select('id, source_id, external_job_id, title, company_name, company_url, description_text, location_raw, city, region, country, employment_type, work_arrangement, salary_min, salary_max, salary_currency, salary_period, posted_at, discovered_at, last_seen_at, job_url, skills, category, sources(name, homepage, attribution_text)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'Lookup failed', detail: error.message }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  return NextResponse.json(data);
}
