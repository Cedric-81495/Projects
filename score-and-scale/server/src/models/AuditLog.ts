import { Schema, model, type InferSchemaType } from 'mongoose'

/**
 * Append-only record of privileged actions.
 *
 * Written by lib/audit.ts, never updated or deleted through the API. Entries
 * store the acting administrator, the affected entity, and a redacted metadata
 * blob so a reviewer can reconstruct what changed and when.
 */
const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorEmail: { type: String, default: '' },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true },
    entityId: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

auditLogSchema.index({ createdAt: -1 })

export type AuditLogType = InferSchemaType<typeof auditLogSchema>
export const AuditLog = model<AuditLogType>('AuditLog', auditLogSchema)
