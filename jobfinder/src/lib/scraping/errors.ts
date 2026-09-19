export class SourceHttpError extends Error {
  constructor(
    message: string,
    readonly url: string,
    readonly status: number | null,
    readonly retryCount: number,
  ) {
    super(message);
    this.name = 'SourceHttpError';
  }
}

export class BudgetExceededError extends Error {
  constructor(readonly limit: number, kind: 'requests' | 'pages') {
    super(`Per-run ${kind} budget of ${limit} reached; stopping cleanly.`);
    this.name = 'BudgetExceededError';
  }
}

export class DisallowedByRobotsError extends Error {
  constructor(readonly url: string) {
    super(`robots.txt disallows ${url} for this user agent.`);
    this.name = 'DisallowedByRobotsError';
  }
}
