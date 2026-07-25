export type EnrollmentStatus = 'pending_payment' | 'active' | 'in_review' | 'funded' | 'cancelled';

const STYLES: Record<EnrollmentStatus, string> = {
  pending_payment: 'bg-paper2/20 text-paper2 border-paper2/40',
  active: 'bg-teal/15 text-teal border-teal/40',
  in_review: 'bg-brass/15 text-brassBright border-brass/40',
  funded: 'bg-teal/25 text-offwhite border-teal',
  cancelled: 'bg-brandRed/15 text-brandRed border-brandRed/40',
};

const LABELS: Record<EnrollmentStatus, string> = {
  pending_payment: 'Pending Payment',
  active: 'Active',
  in_review: 'In Review',
  funded: 'Funded',
  cancelled: 'Cancelled',
};

export function StatusBadge({ status }: { status: EnrollmentStatus }) {
  return (
    <span className={`inline-block font-mono text-xs uppercase tracking-wide border rounded-full px-3 py-1 ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
