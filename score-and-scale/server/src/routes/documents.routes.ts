// server/src/routes/documents.routes.ts  (UPDATED — only the upload-url
// handler changes; everything else is identical to the S3 version)

import { Router } from 'express';
import { z } from 'zod';
import { EnrollmentDocument } from '../models/Document';
import { Enrollment } from '../models/Enrollment';
import { requireAuth } from '../middleware/requireAuth';
import { requireAdmin } from '../middleware/requireAdmin';
import {
  getUploadToken,
  getDownloadUrl,
  buildDocumentKey,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '../lib/storage';

const router = Router();

const uploadUrlSchema = z.object({
  enrollmentId: z.string(),
  type: z.enum(['id', 'credit_report', 'business_doc']),
  originalFilename: z.string().min(1),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  sizeBytes: z.number().positive().max(MAX_FILE_SIZE_BYTES),
});

// POST /api/documents/upload-url — customer requests a signed upload token
// for a specific enrollment. Validates the enrollment actually belongs to
// the requesting user before issuing anything.
// CHANGED: returns { token, s3Key } instead of { uploadUrl, s3Key } — the
// client now uses supabase-js's uploadToSignedUrl(s3Key, token, file)
// rather than a plain PUT.
router.post('/upload-url', requireAuth, async (req, res) => {
  const parsed = uploadUrlSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  }
  const { enrollmentId, type, originalFilename, mimeType, sizeBytes } = parsed.data;

  const enrollment = await Enrollment.findOne({ _id: enrollmentId, userId: req.user!.userId });
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

  const s3Key = buildDocumentKey(req.user!.userId, enrollmentId, originalFilename);
  const { token } = await getUploadToken(s3Key);

  res.json({ token, s3Key, sizeBytes, mimeType, type });
});

const confirmSchema = z.object({
  enrollmentId: z.string(),
  type: z.enum(['id', 'credit_report', 'business_doc']),
  s3Key: z.string(),
  originalFilename: z.string().min(1),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  sizeBytes: z.number().positive().max(MAX_FILE_SIZE_BYTES),
});

// POST /api/documents — customer confirms the upload succeeded; only now
// does the server create the DB record. Unchanged from the S3 version —
// s3Key is kept as the field name to avoid a schema migration, even though
// it now stores a Supabase Storage path rather than an S3 key.
router.post('/', requireAuth, async (req, res) => {
  const parsed = confirmSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request', details: parsed.error.flatten() });
  }
  const { enrollmentId, type, s3Key, originalFilename, mimeType, sizeBytes } = parsed.data;

  const enrollment = await Enrollment.findOne({ _id: enrollmentId, userId: req.user!.userId });
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

  const doc = await EnrollmentDocument.create({
    enrollmentId,
    userId: req.user!.userId,
    type,
    s3Key,
    originalFilename,
    mimeType,
    sizeBytes,
  });

  res.status(201).json({ id: doc._id, type: doc.type, status: doc.status, originalFilename: doc.originalFilename });
});

// GET /api/documents?enrollmentId=... — unchanged, getDownloadUrl still
// takes the same s3Key/path and returns a signed URL.
router.get('/', requireAuth, async (req, res) => {
  const { enrollmentId } = req.query;
  if (typeof enrollmentId !== 'string') {
    return res.status(400).json({ error: 'enrollmentId is required' });
  }

  const docs = await EnrollmentDocument.find({ enrollmentId, userId: req.user!.userId }).sort({ createdAt: -1 });

  const withUrls = await Promise.all(
    docs.map(async (d) => ({
      id: d._id,
      type: d.type,
      originalFilename: d.originalFilename,
      status: d.status,
      reviewNote: d.reviewNote,
      createdAt: d.createdAt,
      downloadUrl: await getDownloadUrl(d.s3Key),
    }))
  );

  res.json(withUrls);
});

// GET /api/documents/admin/all — unchanged.
router.get('/admin/all', requireAuth, requireAdmin, async (_req, res) => {
  const docs = await EnrollmentDocument.find()
    .sort({ createdAt: -1 })
    .populate('userId', 'email')
    .populate('enrollmentId', 'programId');

  const withUrls = await Promise.all(
    docs.map(async (d) => ({
      id: d._id,
      userEmail: (d.userId as any)?.email ?? 'unknown',
      enrollmentId: d.enrollmentId,
      type: d.type,
      originalFilename: d.originalFilename,
      status: d.status,
      createdAt: d.createdAt,
      downloadUrl: await getDownloadUrl(d.s3Key),
    }))
  );

  res.json(withUrls);
});

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  reviewNote: z.string().optional(),
});

// PATCH /api/documents/:id/review — unchanged.
router.patch('/:id/review', requireAuth, requireAdmin, async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid request' });

  const doc = await EnrollmentDocument.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  doc.status = parsed.data.status;
  doc.reviewedBy = req.user!.userId as any;
  if (parsed.data.reviewNote) doc.reviewNote = parsed.data.reviewNote;
  await doc.save();

  res.json({ id: doc._id, status: doc.status });
});

export default router;
