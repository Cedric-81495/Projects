import { BudgetExceededError } from '@/lib/scraping/errors';
import { normalizeParsedJob, passthroughFetch } from '../base';
import type { JobRef, JobSourceConnector, ParsedJob, RawJob, SourceContext } from '../types';
import { parseGreenhouseJob } from './parser';
import { greenhouseBoardSchema, type GreenhouseBoard, type GreenhouseJob } from './types';

interface Payload { job: GreenhouseJob; board: GreenhouseBoard }

const API_BASE = 'https://boards-api.greenhouse.io/v1/boards';

/**
 * Greenhouse Job Boards — one connector covering many employers.
 *
 * Boards are configured, not discovered: we only read boards an operator has
 * explicitly listed, via sources.config.boards or the GREENHOUSE_BOARDS env
 * var. One request returns an entire board, so this is very cheap to run.
 *
 * This connector is also the proof that the architecture holds: it is a
 * different shape of source (multi-tenant, one request per employer, no
 * pagination, no employment-type field) and the core application needed no
 * changes to accept it.
 */
export const greenhouseConnector: JobSourceConnector<Payload> = {
  id: 'greenhouse',
  name: 'Greenhouse Job Boards',
  homepage: 'https://boards.greenhouse.io',
  accessMethod: 'official_api',
  accessNotes:
    'Official public Job Board API. GET is unauthenticated by design — it powers employers\' own careers pages.',

  async discoverJobs(ctx: SourceContext): Promise<JobRef<Payload>[]> {
    const boards = readBoards(ctx);
    if (boards.length === 0) {
      ctx.log('No Greenhouse boards configured; nothing to collect.');
      return [];
    }

    const refs: JobRef<Payload>[] = [];

    for (let board of boards) {
      const url = `${API_BASE}/${encodeURIComponent(board.token)}/jobs?content=true`;
      try {

        const body = await ctx.session.fetchJson<unknown>(url);
        // One board = one page. max_pages_per_run must therefore be at least
        // the number of configured boards, not 1.
        ctx.session.countPage();

        const parsed = greenhouseBoardSchema.safeParse(body);
        if (!parsed.success) {
          ctx.log('Unexpected board response; skipping', { board: board.token });
          continue;
        }
        // Most boards put company_name on each posting. Those that do not
        // would otherwise show the raw token ("jetbrains" instead of
        // "JetBrains"), so look the name up once for the whole board.
        if (!board.company && !parsed.data.jobs.some((j) => j.company_name)) {
          board = { ...board, company: await fetchBoardName(board.token, ctx) };
        }

        for (const job of parsed.data.jobs) {
          refs.push({
            externalJobId: `${board.token}:${job.id}`,
            url: job.absolute_url,
            payload: { job, board },
          });
        }
        ctx.log(`Board ${board.token}: ${parsed.data.jobs.length} jobs`);
      } catch (error) {
        // A budget stop applies to the whole run, so stop cleanly and let the
        // runner report "partial". Swallowing it here would look like every
        // remaining board was broken.
        if (error instanceof BudgetExceededError) {
          ctx.log(`Stopped after ${board.token}: ${error.message}`);
          break;
        }
        // One dead board must not abort the other boards in this run.
        ctx.log(`Board ${board.token} failed: ${(error as Error).message}`);
      }
    }

    return refs;
  },

  fetchJob(ref, ctx): Promise<RawJob<Payload>> {
    return passthroughFetch(ref, ctx);
  },

  parseJob(raw: RawJob<Payload>): ParsedJob {
    return parseGreenhouseJob(raw.payload.job, raw.payload.board);
  },

  normalizeJob(parsed) {
    return normalizeParsedJob('greenhouse', parsed);
  },
};

async function fetchBoardName(
  token: string,
  ctx: SourceContext,
): Promise<string | undefined> {
  try {
    const body = await ctx.session.fetchJson<{ name?: string }>(
      `${API_BASE}/${encodeURIComponent(token)}`,
    );
    const name = body?.name?.trim();
    return name && name.length <= 200 ? name : undefined;
  } catch {
    return undefined;
  }
}

function readBoards(ctx: SourceContext): GreenhouseBoard[] {
  const fromConfig = ctx.config.boards;
  const boards: GreenhouseBoard[] = [];

  if (Array.isArray(fromConfig)) {
    for (const entry of fromConfig) {
      if (typeof entry === 'string') boards.push({ token: normalizeToken(entry) });
      else if (entry && typeof entry === 'object' && 'token' in entry) {
        const e = entry as GreenhouseBoard;
        boards.push({ ...e, token: normalizeToken(e.token) });
      }
    }
  }

  const fromEnv = process.env.GREENHOUSE_BOARDS;
  if (fromEnv) {
    for (const token of fromEnv.split(',').map((t) => t.trim()).filter(Boolean)) {
      boards.push({ token: normalizeToken(token) });
    }
  }

  const seen = new Set<string>();
  return boards.filter((b) => b.token && !seen.has(b.token) && seen.add(b.token));
}

/** Accepts a bare token or a full board URL. */
function normalizeToken(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, '');
  const match = trimmed.match(/greenhouse\.io\/(?:embed\/job_board\?for=)?([^/?#]+)/i);
  return (match ? match[1] : trimmed).toLowerCase();
}
