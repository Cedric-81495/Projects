import { Router } from 'express'
import { z } from 'zod'
import { recordAudit } from '../lib/audit'
import { badRequest, forbidden, notFound } from '../lib/errors'
import { notifyUser } from '../lib/notify'
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  buildDocumentKey,
  createDownloadUrl,
  createUploadToken,
  removeObject,
  statObject,
} from '../lib/storage'
import { asyncHandler } from '../middleware/errorHandler'
import { uploadLimiter } from '../middleware/rateLimit'
import { requireAdmin } from '../middleware/requireAdmin'
import { requireAuth } from '../middleware/requireAuth'
import { objectId, validate } from '../middleware/validate'
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_LABELS,
  EnrollmentDocument,
  type DocumentType,
} from '../models/Document'
import { Enrollment } from '../models/Enrollment'

const router = Router()

router.use(requireAuth)

const uploadTokenSchema = z.object({
  enrollmentId: objectId,
  type: z.enum(DOCUMENT_TYPES),
  originalFilename: z.string().trim().min(1).max(300),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  sizeBytes: z.coerce.number().int().positive().max(MAX_FILE_SIZE_BYTES, 'That file is too large'),
})

/**
 * Confirms the enrollment exists and belongs to the caller.
 *
 * Every document route runs this before touching storage, so a user cannot
 * issue an upload token against somebody else's enrollment or enumerate ids.
 */
async function assertOwnedEnrollment(enrollmentId: string, userId: string) {
  const enrollment = await Enrollment.findById(enrollmentId).select('userId status').lean()
  if (!enrollment) throw notFound('ENROLLMENT_NOT_FOUND', 'That enrollment does not exist.')
  if (String(enrollment.userId) !== userId) {
    throw forbidden('FORBIDDEN', 'That enrollment does not belong to you.')
  }
  return enrollment
}

// ---------------------------------------------------------------------------
// POST /api/documents/upload-url — issue a scoped upload token
// ---------------------------------------------------------------------------
router.post(
  '/upload-url',
  uploadLimiter,
  validate(uploadTokenSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof uploadTokenSchema>
    await assertOwnedEnrollment(input.enrollmentId, req.user!.id)

    /**
     * The key is generated here, never accepted from the client. The token
     * Supabase returns is bound to exactly this path, so a caller cannot
     * redirect their upload to another user's folder.
     */
    const storageKey = buildDocumentKey({
      userId: req.user!.id,
      enrollmentId: input.enrollmentId,
      type: input.type,
      originalFilename: input.originalFilename,
    })

    const token = await createUploadToken(storageKey)

    res.json({ code: 'UPLOAD_TOKEN_ISSUED', token, storageKey })
  }),
)

const confirmSchema = z.object({
  enrollmentId: objectId,
  type: z.enum(DOCUMENT_TYPES),
  storageKey: z.string().trim().min(1).max(500),
  originalFilename: z.string().trim().min(1).max(300),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
})

// ---------------------------------------------------------------------------
// POST /api/documents — confirm an upload landed, then record it
// ---------------------------------------------------------------------------
router.post(
  '/',
  uploadLimiter,
  validate(confirmSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof confirmSchema>
    await assertOwnedEnrollment(input.enrollmentId, req.user!.id)

    /**
     * The storage key is echoed back by the client, so it must be re-verified
     * rather than trusted: it has to sit under this user's own prefix. Without
     * this check a caller could confirm a database record pointing at another
     * customer's file and then read it through the download route.
     */
    if (!input.storageKey.startsWith(`${req.user!.id}/${input.enrollmentId}/`)) {
      throw forbidden('FORBIDDEN', 'That upload does not belong to you.')
    }

    /**
     * Verify the object actually exists and read its real size from storage.
     * A client-reported size could understate a file that was swapped after the
     * token was issued.
     */
    const stat = await statObject(input.storageKey)
    if (!stat.exists) {
      throw badRequest('UPLOAD_NOT_FOUND', 'We could not find that upload. Please try again.')
    }

    if (stat.sizeBytes > MAX_FILE_SIZE_BYTES) {
      // Remove the oversized object so it does not linger unreferenced.
      await removeObject(input.storageKey)
      throw badRequest('FILE_TOO_LARGE', 'That file is larger than the 15MB limit.')
    }

    const document = await EnrollmentDocument.create({
      enrollmentId: input.enrollmentId,
      userId: req.user!.id,
      type: input.type,
      storageKey: input.storageKey,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
      sizeBytes: stat.sizeBytes,
      status: 'pending',
    })

    await recordAudit(req, {
      action: 'document.uploaded',
      entityType: 'EnrollmentDocument',
      entityId: String(document._id),
      metadata: { type: input.type, enrollmentId: input.enrollmentId },
    })

    res.status(201).json({
      code: 'DOCUMENT_CREATED',
      document: {
        id: String(document._id),
        type: document.type,
        status: document.status,
        originalFilename: document.originalFilename,
        sizeBytes: document.sizeBytes,
        createdAt: document.createdAt,
      },
    })
  }),
)

// ---------------------------------------------------------------------------
// GET /api/documents?enrollmentId= — the caller's own documents
// ---------------------------------------------------------------------------
router.get(
  '/',
  validate(z.object({ enrollmentId: objectId }), 'query'),
  asyncHandler(async (req, res) => {
    const { enrollmentId } = req.query as unknown as { enrollmentId: string }
    await assertOwnedEnrollment(enrollmentId, req.user!.id)

    const documents = await EnrollmentDocument.find({
      enrollmentId,
      userId: req.user!.id,
    })
      .sort({ createdAt: -1 })
      .lean()

    /**
     * Download urls are minted per request and expire in 15 minutes, so a link
     * copied out of the page stops working rather than becoming a permanent
     * public handle on someone's ID document.
     */
    const withUrls = await Promise.all(
      documents.map(async (document) => ({
        id: String(document._id),
        type: document.type,
        typeLabel: DOCUMENT_TYPE_LABELS[document.type as DocumentType],
        status: document.status,
        originalFilename: document.originalFilename,
        sizeBytes: document.sizeBytes,
        reviewNote: document.reviewNote,
        createdAt: document.createdAt,
        downloadUrl: await createDownloadUrl(document.storageKey),
      })),
    )

    res.json({ code: 'OK', documents: withUrls })
  }),
)

// ---------------------------------------------------------------------------
// GET /api/documents/admin/all — review queue
// ---------------------------------------------------------------------------
router.get(
  '/admin/all',
  requireAdmin,
  asyncHandler(async (_req, res) => {
    const documents = await EnrollmentDocument.find()
      .populate('userId', 'name email')
      .sort({ status: 1, createdAt: -1 })
      .limit(300)
      .lean()

    const withUrls = await Promise.all(
      documents.map(async (document) => {
        const owner = document.userId as { name?: string; email?: string } | null | undefined
        return {
          id: String(document._id),
          enrollmentId: String(document.enrollmentId),
          customerName: owner?.name ?? '',
          customerEmail: owner?.email ?? '',
          type: document.type,
          typeLabel: DOCUMENT_TYPE_LABELS[document.type as DocumentType],
          status: document.status,
          originalFilename: document.originalFilename,
          sizeBytes: document.sizeBytes,
          reviewNote: document.reviewNote,
          createdAt: document.createdAt,
          downloadUrl: await createDownloadUrl(document.storageKey),
        }
      }),
    )

    res.json({ code: 'OK', documents: withUrls })
  }),
)

// ---------------------------------------------------------------------------
// PATCH /api/documents/:id/review — approve or reject
// ---------------------------------------------------------------------------
router.patch(
  '/:id/review',
  requireAdmin,
  validate(z.object({ id: objectId }), 'params'),
  validate(
    z.object({
      status: z.enum(['approved', 'rejected']),
      reviewNote: z.string().trim().max(500).optional().default(''),
    }),
  ),
  asyncHandler(async (req, res) => {
    const { status, reviewNote } = req.body as { status: 'approved' | 'rejected'; reviewNote: string }

    const document = await EnrollmentDocument.findById(req.params.id)
    if (!document) throw notFound('DOCUMENT_NOT_FOUND', 'That document does not exist.')

    /**
     * A rejection without a reason leaves the customer with no way to fix the
     * problem, so the note is mandatory in that direction only.
     */
    if (status === 'rejected' && !reviewNote) {
      throw badRequest('REVIEW_NOTE_REQUIRED', 'Please explain why the document was rejected.')
    }

    document.status = status
    document.reviewedBy = req.user!.id as unknown as never
    document.reviewedAt = new Date()
    document.reviewNote = reviewNote
    await document.save()

    await recordAudit(req, {
      action: `document.${status}`,
      entityType: 'EnrollmentDocument',
      entityId: String(document._id),
      metadata: { reviewNote },
    })

    await notifyUser({
      userId: document.userId,
      type: 'document_reviewed',
      title: `Your ${DOCUMENT_TYPE_LABELS[document.type as DocumentType]} was ${status}`,
      body: reviewNote,
      href: '/dashboard',
    })

    res.json({ code: 'DOCUMENT_REVIEWED', status })
  }),
)

export default router
