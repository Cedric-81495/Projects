import { Schema, model } from 'mongoose';
import type { Document, Model, Types } from 'mongoose';
import { applyJsonTransform } from './plugins';

export interface AuditLogDoc extends Document {
  actorId: Types.ObjectId | null;
  actorEmail: string;
  action: string;
  resource: string;
  resourceId?: string;
  outcome: 'success' | 'failure';
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<AuditLogDoc>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actorEmail: { type: String, required: true },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    resourceId: { type: String },
    outcome: { type: String, enum: ['success', 'failure'], default: 'success' },
    ip: { type: String },
    userAgent: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

applyJsonTransform(auditLogSchema);

/**
 * Append-only by design.
 *
 * The guide requires that standard administrators cannot edit the audit log. No
 * route exposes update or delete, and these hooks make that structural rather
 * than a matter of remembering — a log that can be quietly rewritten is not
 * evidence of anything.
 */
function blockMutation(this: unknown, next: (err?: Error) => void): void {
  next(new Error('Audit log entries are immutable.'));
}

auditLogSchema.pre('updateOne', blockMutation);
auditLogSchema.pre('updateMany', blockMutation);
auditLogSchema.pre('findOneAndUpdate', blockMutation);
auditLogSchema.pre('deleteOne', blockMutation);
auditLogSchema.pre('deleteMany', blockMutation);

export const AuditLog: Model<AuditLogDoc> = model<AuditLogDoc>('AuditLog', auditLogSchema);
