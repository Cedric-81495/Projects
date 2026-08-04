import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { StoryModel } from '../models/Story.js';
import { EpisodeModel } from '../models/Episode.js';
import { TrackModel } from '../models/Track.js';

export const contentRouter = Router();

// GET /api/stories → Story[] in the frontend shape (slug → id)
contentRouter.get(
  '/stories',
  asyncHandler(async (_req, res) => {
    const docs = await StoryModel.find({ published: true }).sort({ order: 1, createdAt: -1 }).lean();
    const data = docs.map((d) => ({
      id: d.slug,
      title: d.title,
      guest: d.guest,
      chapter: d.chapter,
      duration: d.duration,
      blurb: d.blurb,
    }));
    res.json({ data });
  }),
);

// GET /api/episodes → Episode[]
contentRouter.get(
  '/episodes',
  asyncHandler(async (_req, res) => {
    const docs = await EpisodeModel.find({ published: true }).sort({ order: 1, createdAt: -1 }).lean();
    const data = docs.map((d) => ({
      id: d.slug,
      number: d.number,
      title: d.title,
      guest: d.guest,
      duration: d.duration,
    }));
    res.json({ data });
  }),
);

// GET /api/tracks → Track[]
contentRouter.get(
  '/tracks',
  asyncHandler(async (_req, res) => {
    const docs = await TrackModel.find({ published: true }).sort({ order: 1, createdAt: -1 }).lean();
    const data = docs.map((d) => ({
      id: d.slug,
      title: d.title,
      artist: d.artist,
      length: d.length,
    }));
    res.json({ data });
  }),
);
