import { Router } from 'express'
import { z } from 'zod'
import { forbidden, notFound } from '../lib/errors'
import { asyncHandler } from '../middleware/errorHandler'
import { requireAuth } from '../middleware/requireAuth'
import { objectId, validate } from '../middleware/validate'
import { Enrollment } from '../models/Enrollment'
import { Lesson } from '../models/Lesson'
import { LessonProgress } from '../models/LessonProgress'
import { Program } from '../models/Program'

const router = Router()

router.use(requireAuth)

/** Program slugs the caller has paid-for access to. */
async function entitledProgramSlugs(userId: string): Promise<string[]> {
  const enrollments = await Enrollment.find({
    userId,
    status: { $in: ['active', 'in_review', 'funded'] },
  })
    .select('programId')
    .lean()

  if (enrollments.length === 0) return []

  const programs = await Program.find({
    _id: { $in: enrollments.map((enrollment) => enrollment.programId) },
  })
    .select('slug')
    .lean()

  return programs.map((program) => program.slug)
}

// ---------------------------------------------------------------------------
// GET /api/academy — curriculum plus the caller's progress
// ---------------------------------------------------------------------------
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [lessons, progress, slugs] = await Promise.all([
      Lesson.find({ published: true })
        // `content` is withheld from the index so the payload stays small; the
        // detail route serves it.
        .select('slug title summary module moduleOrder lessonOrder durationMinutes programSlugs')
        .sort({ moduleOrder: 1, lessonOrder: 1 })
        .lean(),
      LessonProgress.find({ userId: req.user!.id }).lean(),
      entitledProgramSlugs(req.user!.id),
    ])

    const progressByLesson = new Map(
      progress.map((entry) => [String(entry.lessonId), entry]),
    )

    const items = lessons.map((lesson) => {
      const entry = progressByLesson.get(String(lesson._id))
      /**
       * An empty programSlugs list means the lesson is open to every enrolled
       * customer; otherwise it requires one of the named programs.
       */
      const unlocked =
        lesson.programSlugs.length === 0
          ? slugs.length > 0
          : lesson.programSlugs.some((slug) => slugs.includes(slug))

      return {
        id: String(lesson._id),
        slug: lesson.slug,
        title: lesson.title,
        summary: lesson.summary,
        module: lesson.module,
        durationMinutes: lesson.durationMinutes,
        unlocked,
        completed: Boolean(entry?.completedAt),
        lastPositionSeconds: entry?.lastPositionSeconds ?? 0,
      }
    })

    const completed = items.filter((item) => item.completed).length

    res.json({
      code: 'OK',
      lessons: items,
      progress: {
        completed,
        total: items.length,
        percent: items.length === 0 ? 0 : Math.round((completed / items.length) * 100),
      },
    })
  }),
)

// ---------------------------------------------------------------------------
// GET /api/academy/:slug — lesson detail
// ---------------------------------------------------------------------------
router.get(
  '/:slug',
  validate(z.object({ slug: z.string().trim().min(1).max(200) }), 'params'),
  asyncHandler(async (req, res) => {
    const lesson = await Lesson.findOne({ slug: req.params.slug, published: true }).lean()
    if (!lesson) throw notFound('LESSON_NOT_FOUND', 'That lesson does not exist.')

    /**
     * Entitlement is enforced here, not only in the client. Hiding a locked
     * lesson in the UI is presentation; this is the actual access control.
     */
    const slugs = await entitledProgramSlugs(req.user!.id)
    const unlocked =
      lesson.programSlugs.length === 0
        ? slugs.length > 0
        : lesson.programSlugs.some((slug) => slugs.includes(slug))

    if (!unlocked) {
      throw forbidden('LESSON_LOCKED', 'This lesson is not included in your current program.')
    }

    const progress = await LessonProgress.findOne({
      userId: req.user!.id,
      lessonId: lesson._id,
    }).lean()

    res.json({
      code: 'OK',
      lesson: {
        id: String(lesson._id),
        slug: lesson.slug,
        title: lesson.title,
        summary: lesson.summary,
        module: lesson.module,
        durationMinutes: lesson.durationMinutes,
        videoUrl: lesson.videoUrl,
        content: lesson.content,
        completed: Boolean(progress?.completedAt),
        lastPositionSeconds: progress?.lastPositionSeconds ?? 0,
      },
    })
  }),
)

// ---------------------------------------------------------------------------
// PUT /api/academy/:id/progress
// ---------------------------------------------------------------------------
router.put(
  '/:id/progress',
  validate(z.object({ id: objectId }), 'params'),
  validate(
    z.object({
      completed: z.boolean().optional(),
      lastPositionSeconds: z.coerce.number().int().min(0).max(86_400).optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const { completed, lastPositionSeconds } = req.body as {
      completed?: boolean
      lastPositionSeconds?: number
    }

    const lesson = await Lesson.findById(req.params.id).select('_id programSlugs').lean()
    if (!lesson) throw notFound('LESSON_NOT_FOUND', 'That lesson does not exist.')

    const slugs = await entitledProgramSlugs(req.user!.id)
    const unlocked =
      lesson.programSlugs.length === 0
        ? slugs.length > 0
        : lesson.programSlugs.some((slug) => slugs.includes(slug))

    if (!unlocked) {
      throw forbidden('LESSON_LOCKED', 'This lesson is not included in your current program.')
    }

    const update: Record<string, unknown> = {}
    if (completed !== undefined) update.completedAt = completed ? new Date() : null
    if (lastPositionSeconds !== undefined) update.lastPositionSeconds = lastPositionSeconds

    const progress = await LessonProgress.findOneAndUpdate(
      { userId: req.user!.id, lessonId: lesson._id },
      { $set: update, $setOnInsert: { userId: req.user!.id, lessonId: lesson._id } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean()

    res.json({
      code: 'PROGRESS_SAVED',
      completed: Boolean(progress?.completedAt),
      lastPositionSeconds: progress?.lastPositionSeconds ?? 0,
    })
  }),
)

export default router
