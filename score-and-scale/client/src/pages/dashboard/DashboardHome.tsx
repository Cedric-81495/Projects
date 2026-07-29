import { useCallback, useEffect, useState } from 'react'
import { DashboardSidebar } from '../../components/dashboard/DashboardSidebar'
import { DocumentUpload } from '../../components/dashboard/DocumentUpload'
import { PaymentHistory } from '../../components/dashboard/PaymentHistory'
import { StatusBadge } from '../../components/dashboard/StatusBadge'
import { Timeline, type TimelineEntry } from '../../components/dashboard/Timeline'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { FormError } from '../../components/ui/Field'
import { SkeletonText } from '../../components/ui/Skeleton'
import { useAuth } from '../../context/AuthContext'
import { ApiError, apiFetch } from '../../lib/api'
import { formatDate, formatPrice } from '../../lib/format'

interface Enrollment {
  id: string
  status: string
  createdAt: string
  program: { id: string; name: string; slug: string; priceCents: number } | null
  history: TimelineEntry[]
}

/** Statuses a customer may cancel from — mirrors the server's rule. */
const SELF_CANCELLABLE = new Set(['pending_payment', 'in_review'])

export function DashboardHome() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await apiFetch<{ enrollments: Enrollment[] }>(
        '/api/enrollments',
        signal ? { signal } : {},
      )
      setEnrollments(data.enrollments)
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return
      setError('We could not load your enrollments. Please refresh to try again.')
      setEnrollments([])
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  async function cancel(id: string) {
    setCancellingId(id)
    setError(null)

    try {
      await apiFetch(`/api/enrollments/${id}/cancel`, { method: 'PATCH' })
      await load()
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'We could not cancel that enrollment. Please try again.',
      )
    } finally {
      setCancellingId(null)
    }
  }

  const firstName = user?.name.split(' ')[0] ?? 'there'

  return (
    <div className="py-12 sm:py-16">
      <div className="container-page">
        <header className="mb-9">
          <h1 className="text-display-md font-semibold text-ink">Welcome back, {firstName}.</h1>
          <p className="mt-2 text-muted">
            Track your programs, upload documents, and see where your file stands.
          </p>
        </header>

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          <DashboardSidebar />

          <div className="min-w-0 flex-1 space-y-8">
            {error && <FormError>{error}</FormError>}

            <section aria-labelledby="enrollments-heading">
              <h2 id="enrollments-heading" className="sr-only">
                Your enrollments
              </h2>

              {enrollments === null ? (
                <Card>
                  <CardBody>
                    <SkeletonText lines={4} />
                  </CardBody>
                </Card>
              ) : enrollments.length === 0 ? (
                <Card>
                  <EmptyState
                    title="You are not enrolled yet"
                    description="Choose a program to begin your audit and unlock the academy."
                    action={
                      <ButtonLink to="/#programs" variant="primary" size="md">
                        Browse programs
                      </ButtonLink>
                    }
                  />
                </Card>
              ) : (
                <ul className="space-y-6">
                  {enrollments.map((enrollment) => (
                    <li key={enrollment.id}>
                      <Card>
                        <CardHeader
                          title={enrollment.program?.name ?? 'Program'}
                          description={`Enrolled ${formatDate(enrollment.createdAt)}${
                            enrollment.program
                              ? ` · ${formatPrice(enrollment.program.priceCents)}`
                              : ''
                          }`}
                          action={<StatusBadge status={enrollment.status} />}
                        />

                        <CardBody className="space-y-7">
                          <div>
                            <h3 className="mb-3 text-sm font-semibold text-ink">Activity</h3>
                            <Timeline entries={enrollment.history} />
                          </div>

                          {/*
                            Uploads are only meaningful once the enrollment is
                            live; before payment there is nothing to review.
                          */}
                          {enrollment.status !== 'pending_payment' &&
                            enrollment.status !== 'cancelled' && (
                              <div className="border-t border-line pt-6">
                                <DocumentUpload enrollmentId={enrollment.id} />
                              </div>
                            )}

                          {enrollment.status === 'pending_payment' && enrollment.program && (
                            <div className="border-t border-line pt-6">
                              <ButtonLink
                                to={`/checkout?program=${enrollment.program.slug}`}
                                variant="accent"
                                size="md"
                              >
                                Complete payment
                              </ButtonLink>
                            </div>
                          )}

                          {SELF_CANCELLABLE.has(enrollment.status) && (
                            <div className="border-t border-line pt-5">
                              <Button
                                variant="ghost"
                                size="sm"
                                loading={cancellingId === enrollment.id}
                                onClick={() => void cancel(enrollment.id)}
                              >
                                Cancel this enrollment
                              </Button>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Rendered once, below the enrollment list — not per card. */}
            <PaymentHistory />
          </div>
        </div>
      </div>
    </div>
  )
}
