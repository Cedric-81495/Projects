import type { ErrorRequestHandler } from 'express';
import { env } from '../config/env.js';

/** Error with an HTTP status the client should see. */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // Mongo duplicate key (e.g. email already subscribed) → treat as success-ish 409.
  if (err && typeof err === 'object' && 'code' in err && (err as { code: unknown }).code === 11000) {
    return res.status(409).json({ message: 'This entry already exists.' });
  }

  const status = err instanceof HttpError ? err.status : 500;
  const message =
    err instanceof HttpError || env.NODE_ENV !== 'production'
      ? (err as Error).message
      : 'Something went wrong.';

  if (status >= 500) console.error(err);
  res.status(status).json({ message });
};
