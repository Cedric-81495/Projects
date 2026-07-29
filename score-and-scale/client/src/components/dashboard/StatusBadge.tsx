import { Badge, type BadgeTone } from '../ui/Badge'
import { humanise } from '../../lib/format'

export type EnrollmentStatus =
  | 'pending_payment'
  | 'active'
  | 'in_review'
  | 'funded'
  | 'cancelled'

/**
 * Maps every value of the Enrollment.status enum to a tone.
 *
 * The record is exhaustive by type, so adding a status to the server enum
 * without handling it here becomes a compile error rather than an unstyled badge.
 */
const TONES: Record<EnrollmentStatus, BadgeTone> = {
  pending_payment: 'warning',
  active: 'accent',
  in_review: 'neutral',
  funded: 'positive',
  cancelled: 'critical',
}

export function StatusBadge({ status }: { status: string }) {
  const tone = TONES[status as EnrollmentStatus] ?? 'neutral'
  return <Badge tone={tone}>{humanise(status)}</Badge>
}

const DOCUMENT_TONES: Record<string, BadgeTone> = {
  pending: 'warning',
  approved: 'positive',
  rejected: 'critical',
}

export function DocumentStatusBadge({ status }: { status: string }) {
  return <Badge tone={DOCUMENT_TONES[status] ?? 'neutral'}>{humanise(status)}</Badge>
}

const PAYMENT_TONES: Record<string, BadgeTone> = {
  succeeded: 'positive',
  failed: 'critical',
  refunded: 'warning',
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return <Badge tone={PAYMENT_TONES[status] ?? 'neutral'}>{humanise(status)}</Badge>
}
