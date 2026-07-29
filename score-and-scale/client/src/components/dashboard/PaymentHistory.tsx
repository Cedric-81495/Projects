import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { formatCurrency, formatDate } from '../../lib/format'
import { Card, CardBody, CardHeader } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { SkeletonText } from '../ui/Skeleton'
import { PaymentStatusBadge } from './StatusBadge'

interface PaymentRow {
  id: string
  programName: string
  amountCents: number
  currency: string
  status: string
  cardBrand: string
  cardLast4: string
  transactionId: string
  createdAt: string
}

/**
 * Account-wide payment history.
 *
 * Rendered once per page rather than inside each enrollment card: a payment is
 * reached through its enrollment in the data model, but a customer thinks about
 * their receipts as one list.
 */
export function PaymentHistory() {
  const [payments, setPayments] = useState<PaymentRow[] | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    apiFetch<{ payments: PaymentRow[] }>('/api/payments', { signal: controller.signal })
      .then((data) => setPayments(data.payments))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setPayments([])
      })

    return () => controller.abort()
  }, [])

  return (
    <Card>
      <CardHeader title="Payment history" description="Every charge on your account." />

      {payments === null ? (
        <CardBody>
          <SkeletonText lines={3} />
        </CardBody>
      ) : payments.length === 0 ? (
        <EmptyState
          title="No payments yet"
          description="Charges will appear here once you enroll in a program."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <caption className="sr-only">Your payment history</caption>
            <thead>
              <tr className="border-b border-line text-left">
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-subtle sm:px-6">
                  Program
                </th>
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-subtle">
                  Amount
                </th>
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-subtle">
                  Status
                </th>
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-subtle">
                  Date
                </th>
                <th scope="col" className="px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-subtle sm:px-6">
                  Transaction
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-5 py-3.5 font-medium text-ink sm:px-6">{payment.programName}</td>
                  <td className="px-5 py-3.5 tabular-nums text-ink">
                    {formatCurrency(payment.amountCents, payment.currency)}
                  </td>
                  <td className="px-5 py-3.5">
                    <PaymentStatusBadge status={payment.status} />
                  </td>
                  <td className="px-5 py-3.5 text-muted">{formatDate(payment.createdAt)}</td>
                  <td className="px-5 py-3.5 sm:px-6">
                    <span className="font-mono text-xs text-subtle">{payment.transactionId}</span>
                    {payment.cardLast4 && (
                      <span className="mt-0.5 block text-xs text-subtle">
                        {payment.cardBrand} ····{payment.cardLast4}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
