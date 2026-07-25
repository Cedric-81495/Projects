import { Router } from 'express';
import { Program } from '../models/Program';

const router = Router();

// GET /api/programs — public list of all available programs.
// No auth required: the marketing Tiers section and the logged-in
// dashboard's "other services" list both need this.
router.get('/', async (_req, res) => {
  const programs = await Program.find().sort({ priceCents: 1 });

  res.json(
    programs.map((p) => ({
      id: p._id,
      slug: p.slug,
      name: p.name,
      priceCents: p.priceCents,
      billingType: p.billingType,
    }))
  );
});

export default router;
