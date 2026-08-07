import type { Response } from 'express';

/**
 * Response envelope.
 *
 * The shape is fixed by the frontend's api client, which unwraps `data` on
 * every call and reads `message` / `errors` on failure. Changing it breaks
 * every request, so both sides are documented as one contract.
 */
export interface Envelope<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorEnvelope {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export function ok<T>(res: Response, data: T, message?: string): void {
  const body: Envelope<T> = { success: true, data, ...(message ? { message } : {}) };
  res.json(body);
}

export function created<T>(res: Response, data: T, message?: string): void {
  res.status(201);
  ok(res, data, message);
}

export function noContent(res: Response): void {
  res.status(204).end();
}

export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function page<T>(items: T[], total: number, pageNum: number, pageSize: number): PageResult<T> {
  return {
    items,
    page: pageNum,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
