import type { Request } from 'express'
import { AuditLog } from '../models/AuditLog'
import { logger } from './logger'

interface AuditInput {
  action: string
  entityType: string
  entityId?: string
  metadata?: Record<string, unknown>
}

/**
 * Records a privileged action.
 *
 * Deliberately never throws: an audit write must not be able to fail the
 * business operation it describes. A failure is logged loudly instead, because
 * a silent gap in the trail is worse than a noisy one.
 */
export async function recordAudit(req: Request, input: AuditInput): Promise<void> {
  try {
    await AuditLog.create({
      actorId: req.user?.id ?? null,
      actorEmail: req.user?.email ?? '',
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? '',
      metadata: input.metadata ?? {},
      ip: req.ip ?? '',
    })
  } catch (error) {
    logger.error('Failed to write audit log entry', {
      action: input.action,
      entityType: input.entityType,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
