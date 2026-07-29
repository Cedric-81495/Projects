import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { Program } from '../models/Program'

const router = Router()

/**
 * GET /api/programs — public pricing data for the funnel page.
 *
 * Only active programs are returned, ordered for display. This is the same
 * source checkout prices from, so the grid can never advertise a figure the
 * server would refuse to charge.
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const programs = await Program.find({ active: true })
      .select('slug name tagline description priceCents currency features highlighted sortOrder')
      .sort({ sortOrder: 1, priceCents: 1 })
      .lean()

    res.json({
      code: 'OK',
      programs: programs.map((program) => ({
        id: String(program._id),
        slug: program.slug,
        name: program.name,
        tagline: program.tagline,
        description: program.description,
        priceCents: program.priceCents,
        currency: program.currency,
        features: program.features,
        highlighted: program.highlighted,
      })),
    })
  }),
)

export default router
