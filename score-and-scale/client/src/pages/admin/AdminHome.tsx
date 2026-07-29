import { useEffect, useState } from 'react'
import { KpiCard } from '../../components/admin/KpiCard'
import { RevenueChart, type RevenuePoint } from '../../components/admin/RevenueChart'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { FormError } from '../../components/ui/Field'
import { apiFetch } from '../../lib/api'
import { formatCurrency } from '../../lib/format'

interface KpiResponse {
  kpis: {
    totalEnrollments: number
    activeEnrollments: number
    newContacts: number
    revenueThisMonthCents: number
  }
  revenueTrend: RevenuePoint[]
}

export function AdminHome() {
  const [data, setData] = useState<KpiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    apiFetch<KpiResponse>('/api/admin/kpis', { signal: controller.signal })
      .then(setData)
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return
        setError('We could not load the overview. Please refresh to try again.')
      })

    return () => controller.abort()
  }, [])

  const kpis = data?.kpis

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-display-sm font-semibold text-ink">Overview</h1>
        <p className="mt-1.5 text-sm text-muted">Where the business stands right now.</p>
      </header>

      {error && (
        <div className="mb-6">
          <FormError>{error}</FormError>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total enrollments"
          value={kpis ? String(kpis.totalEnrollments) : null}
          hint="All time"
        />
        <KpiCard
          label="Active"
          value={kpis ? String(kpis.activeEnrollments) : null}
          hint="Active, in review, or funded"
        />
        <KpiCard
          label="New enquiries"
          value={kpis ? String(kpis.newContacts) : null}
          hint="Unread in the inbox"
        />
        <KpiCard
          label="Revenue this month"
          value={kpis ? formatCurrency(kpis.revenueThisMonthCents) : null}
          hint="Successful charges only"
        />
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader title="Revenue" description="Successful charges by month." />
          <CardBody>
            <RevenueChart points={data?.revenueTrend ?? null} />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
