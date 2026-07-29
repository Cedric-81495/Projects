import { useCallback, useEffect, useState } from 'react'
import { DashboardSidebar } from '../../components/dashboard/DashboardSidebar'
import { Button } from '../../components/ui/Button'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonText } from '../../components/ui/Skeleton'
import { apiFetch } from '../../lib/api'
import { cn } from '../../lib/cn'

interface LessonItem {
  id: string
  slug: string
  title: string
  summary: string
  module: string
  durationMinutes: number
  unlocked: boolean
  completed: boolean
}

interface AcademyResponse {
  lessons: LessonItem[]
  progress: { completed: number; total: number; percent: number }
}

export function Academy() {
  const [data, setData] = useState<AcademyResponse | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await apiFetch<AcademyResponse>('/api/academy', signal ? { signal } : {})
      setData(response)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      setData({ lessons: [], progress: { completed: 0, total: 0, percent: 0 } })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  async function toggle(lesson: LessonItem) {
    setSaving(lesson.id)
    try {
      await apiFetch(`/api/academy/${lesson.id}/progress`, {
        method: 'PUT',
        body: { completed: !lesson.completed },
      })
      await load()
    } finally {
      setSaving(null)
    }
  }

  /**
   * Lessons arrive already ordered by module then position, so grouping
   * preserves that order without a second sort.
   */
  const modules = new Map<string, LessonItem[]>()
  for (const lesson of data?.lessons ?? []) {
    const existing = modules.get(lesson.module)
    if (existing) existing.push(lesson)
    else modules.set(lesson.module, [lesson])
  }

  return (
    <div className="py-12 sm:py-16">
      <div className="container-page">
        <header className="mb-9">
          <h1 className="text-display-md font-semibold text-ink">Academy</h1>
          <p className="mt-2 text-muted">
            The material behind the work we do on your file. Short, practical, in order.
          </p>
        </header>

        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          <DashboardSidebar />

          <div className="min-w-0 flex-1 space-y-8">
            {data === null ? (
              <Card>
                <CardBody>
                  <SkeletonText lines={5} />
                </CardBody>
              </Card>
            ) : data.lessons.length === 0 ? (
              <Card>
                <EmptyState
                  title="No lessons available yet"
                  description="The academy unlocks once your enrollment is active."
                />
              </Card>
            ) : (
              <>
                <Card>
                  <CardBody>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-ink">Your progress</p>
                        <p className="mt-1 text-sm text-muted">
                          {data.progress.completed} of {data.progress.total} lessons complete
                        </p>
                      </div>
                      <span className="text-2xl font-semibold tabular-nums text-accent">
                        {data.progress.percent}%
                      </span>
                    </div>

                    <div
                      className="mt-4 h-2 overflow-hidden rounded-pill bg-raised"
                      role="progressbar"
                      aria-valuenow={data.progress.percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Academy progress"
                    >
                      <div
                        className="h-full rounded-pill bg-accent transition-[width] duration-500 ease-entrance"
                        style={{ width: `${data.progress.percent}%` }}
                      />
                    </div>
                  </CardBody>
                </Card>

                {Array.from(modules.entries()).map(([moduleName, lessons]) => (
                  <Card key={moduleName}>
                    <CardHeader title={moduleName} />
                    <ul className="divide-y divide-line">
                      {lessons.map((lesson) => (
                        <li
                          key={lesson.id}
                          className="flex flex-wrap items-start justify-between gap-4 px-5 py-4 sm:px-6"
                        >
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                'text-[0.9375rem] font-medium',
                                lesson.unlocked ? 'text-ink' : 'text-subtle',
                              )}
                            >
                              {lesson.title}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-muted">
                              {lesson.summary}
                            </p>
                            <p className="mt-1.5 text-xs text-subtle">
                              {lesson.durationMinutes} min
                              {!lesson.unlocked && ' · Included in a higher tier'}
                            </p>
                          </div>

                          {lesson.unlocked ? (
                            <Button
                              variant={lesson.completed ? 'secondary' : 'primary'}
                              size="sm"
                              loading={saving === lesson.id}
                              onClick={() => void toggle(lesson)}
                            >
                              {lesson.completed ? 'Completed' : 'Mark complete'}
                            </Button>
                          ) : (
                            <span
                              className="mt-1 text-subtle"
                              aria-label="Locked"
                              title="Included in a higher tier"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <rect
                                  x="5"
                                  y="10.5"
                                  width="14"
                                  height="9.5"
                                  rx="2"
                                  stroke="currentColor"
                                  strokeWidth="1.75"
                                />
                                <path
                                  d="M8.5 10.5V8a3.5 3.5 0 1 1 7 0v2.5"
                                  stroke="currentColor"
                                  strokeWidth="1.75"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
