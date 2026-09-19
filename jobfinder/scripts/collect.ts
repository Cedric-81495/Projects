/**
 * Collection worker.
 *
 * Runs the same code path as /api/cron/collect, but from a plain Node process,
 * so collection does not depend on Vercel's function time limit. Use it from
 * GitHub Actions (see .github/workflows/collect.yml), any free scheduler, or
 * your own machine.
 *
 *   npm run collect            # every source that is due
 *   npm run collect -- --all   # every enabled source, ignoring the schedule
 *   npm run collect -- arbeitnow greenhouse
 */
import 'dotenv/config';
import { runAllEnabled, runDueSources, runSource, type RunSummary } from '../src/lib/collect/run';
import { serviceClient } from '../src/lib/db/supabase';

async function main() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const ids = args.filter((a) => !a.startsWith('-'));

  const db = serviceClient();
  let summaries: RunSummary[];

  if (ids.length > 0) {
    summaries = [];
    for (const id of ids) summaries.push(await runSource(db, id));
  } else {
    summaries = all ? await runAllEnabled(db) : await runDueSources(db);
  }

  if (summaries.length === 0) {
    console.log('No sources were due. Use --all to force a run.');
    return;
  }

  for (const s of summaries) {
    const line = [
      s.status.toUpperCase().padEnd(8),
      s.sourceId.padEnd(14),
      `found ${s.jobsFound}`,
      `new ${s.jobsNew}`,
      `updated ${s.jobsUpdated}`,
      `dupes ${s.duplicates}`,
      `invalid ${s.invalid}`,
      `${s.requests} req`,
      `${Math.round(s.durationMs / 1000)}s`,
    ].join('  ');
    console.log(line);
    if (s.error) console.log(`         ${s.error}`);
  }

  // Exit non-zero only when every source failed, so a scheduler flags a real
  // outage but tolerates one flaky site.
  if (summaries.every((s) => s.status === 'failed')) process.exit(1);
}

main().catch((error) => {
  console.error('Collection worker crashed:', error);
  process.exit(1);
});
