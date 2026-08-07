import type { Request } from 'express';
import { AuditLog } from '@/models/AuditLog';
import { logger } from '@/lib/logger';

/**
 * Records an administrative action.
 *
 * Never awaited by request handlers and never allowed to throw: a failure to
 * write the log must not fail the operation the admin actually asked for. A
 * failed write is logged loudly instead, because a silently missing audit trail
 * is worse than a noisy one.
 */
export function audit(
  req: Request,
  action: string,
  resource: string,
  options: { resourceId?: string; outcome?: 'success' | 'failure'; meta?: Record<string, unknown>; actorEmail?: string } = {}
): void {
  void AuditLog.create({
    actorId: req.actor?.id ?? null,
    actorEmail: req.actor?.email ?? options.actorEmail ?? 'anonymous',
    action,
    resource,
    resourceId: options.resourceId,
    outcome: options.outcome ?? 'success',
    ip: req.ip,
    userAgent: req.get('user-agent'),
    meta: options.meta,
  }).catch((error: unknown) => {
    logger.error({ error, action, resource }, 'failed to write audit log entry');
  });
}
