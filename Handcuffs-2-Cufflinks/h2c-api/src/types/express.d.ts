import type { Role } from './auth';

declare global {
  namespace Express {
    interface Request {
      /** Populated by requireAuth. Absent on public routes. */
      actor?: { id: string; email: string; role: Role };
      /** Populated by requireMember / optionalMember. Absent for anonymous visitors. */
      member?: { id: string; email: string };
      /** Anonymous engagement identifier, set by the visitor middleware. */
      visitorId?: string;
      /** Parsed query params, set by validateQuery. Read it via `query<T>(req)`. */
      validatedQuery?: unknown;
    }
  }
}

export {};
