import { BudgetExceededError, DisallowedByRobotsError, SourceHttpError } from './errors';
import { getRobots, isAllowed } from './robots';

export interface CrawlPolicy {
  userAgent: string;
  requestDelayMs: number;
  maxRequestsPerRun: number;
  maxPagesPerRun: number;
  retryLimit: number;
  respectRobots: boolean;
  timeoutMs?: number;
}

/**
 * Tracks the per-run budget and spacing for one source. A connector never
 * calls fetch() directly — it goes through here, so rate limits, retries and
 * robots.txt are enforced in one place.
 */
export class CrawlSession {
  private requests = 0;
  private pages = 0;
  private lastRequestAt = 0;
  private robotsDelayMs: number | null = null;

  constructor(
    readonly sourceId: string,
    readonly policy: CrawlPolicy,
  ) {}

  get requestsMade(): number { return this.requests; }
  get pagesFetched(): number { return this.pages; }

  countPage(): void {
    this.pages += 1;
    if (this.pages > this.policy.maxPagesPerRun) {
      throw new BudgetExceededError(this.policy.maxPagesPerRun, 'pages');
    }
  }

  hasPageBudget(): boolean { return this.pages < this.policy.maxPagesPerRun; }

  private async throttle(): Promise<void> {
    const delay = Math.max(this.policy.requestDelayMs, this.robotsDelayMs ?? 0);
    const elapsed = Date.now() - this.lastRequestAt;
    if (this.lastRequestAt && elapsed < delay) {
      await sleep(delay - elapsed);
    }
    this.lastRequestAt = Date.now();
  }

  async fetch(url: string, init: RequestInit = {}): Promise<Response> {
    if (this.requests >= this.policy.maxRequestsPerRun) {
      throw new BudgetExceededError(this.policy.maxRequestsPerRun, 'requests');
    }

    if (this.policy.respectRobots) {
      const origin = new URL(url).origin;
      const rules = await getRobots(origin, this.policy.userAgent);
      if (rules === null) {
        throw new DisallowedByRobotsError(`${url} (robots.txt unavailable; failing closed)`);
      }
      if (!isAllowed(rules, url)) throw new DisallowedByRobotsError(url);
      if (rules.crawlDelayMs) this.robotsDelayMs = rules.crawlDelayMs;
    }

    let attempt = 0;
    let lastStatus: number | null = null;

    while (attempt <= this.policy.retryLimit) {
      await this.throttle();
      this.requests += 1;

      try {
        const res = await fetch(url, {
          ...init,
          headers: {
            'user-agent': this.policy.userAgent,
            accept: 'application/json, text/html;q=0.9, */*;q=0.8',
            ...(init.headers ?? {}),
          },
          signal: AbortSignal.timeout(this.policy.timeoutMs ?? 20_000),
        });

        if (res.ok) return res;
        lastStatus = res.status;

        // 4xx other than 408/429 will not improve on retry.
        if (res.status < 500 && res.status !== 429 && res.status !== 408) {
          throw new SourceHttpError(`HTTP ${res.status} for ${url}`, url, res.status, attempt);
        }

        const retryAfter = Number(res.headers.get('retry-after'));
        const wait = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : backoffMs(attempt);
        await sleep(wait);
      } catch (error) {
        if (error instanceof SourceHttpError) throw error;
        if (attempt === this.policy.retryLimit) {
          throw new SourceHttpError(
            `Request failed for ${url}: ${(error as Error).message}`, url, lastStatus, attempt,
          );
        }
        await sleep(backoffMs(attempt));
      }
      attempt += 1;
    }

    throw new SourceHttpError(
      `Exhausted ${this.policy.retryLimit} retries for ${url}`, url, lastStatus, attempt,
    );
  }

  async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await this.fetch(url, init);
    return (await res.json()) as T;
  }

  async fetchText(url: string, init?: RequestInit): Promise<string> {
    const res = await this.fetch(url, init);
    return res.text();
  }
}

/** Exponential backoff with full jitter, capped at 30s. */
export function backoffMs(attempt: number): number {
  const base = Math.min(30_000, 1000 * 2 ** attempt);
  return Math.round(base / 2 + Math.random() * (base / 2));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
