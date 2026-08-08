import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '@/lib/ApiError';
import { asyncHandler } from '@/lib/asyncHandler';
import { created, ok, page } from '@/lib/envelope';
import { audit } from '@/middleware/audit';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { query, validateBody, validateQuery } from '@/middleware/validate';
import { MediaAsset } from '@/models/MediaAsset';

/**
 * Digital asset library.
 *
 * The guide asks for one centralised library organised by brand, with alt text,
 * tagging, and controlled removal. All of that is cataloguing, and none of it
 * needs a storage backend — so the library ships now against assets that are
 * already hosted (the photographer's delivery, YouTube, a CDN) and gains an
 * upload path later without the records changing shape.
 *
 * What that buys today: a VA picking a cover image chooses from a list with alt
 * text already written, instead of pasting a URL from a message thread into
 * every record that needs it.
 *
 * Deliberately not here:
 *   - Multipart upload. A storage decision is outstanding, and choosing one
 *     inside a route handler is how a platform ends up married to a vendor by
 *     accident.
 *   - Hard delete. See `archivedAt` on the model.
 *
 * The whole module is behind authentication: an asset list is an inventory of
 * unreleased material, including drop imagery that has not been announced.
 */
export const mediaRouter = Router();

mediaRouter.use(requireAuth);

const KIND_BY_EXTENSION: Record<string, 'image' | 'video' | 'audio' | 'document'> = {
  jpg: 'image', jpeg: 'image', png: 'image', webp: 'image', avif: 'image', gif: 'image', svg: 'image',
  mp4: 'video', mov: 'video', webm: 'video', m4v: 'video',
  mp3: 'audio', wav: 'audio', m4a: 'audio', aac: 'audio', flac: 'audio',
  pdf: 'document', doc: 'document', docx: 'document', txt: 'document',
};

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  avif: 'image/avif', gif: 'image/gif', svg: 'image/svg+xml',
  mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', m4v: 'video/x-m4v',
  mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', aac: 'audio/aac', flac: 'audio/flac',
  pdf: 'application/pdf', txt: 'text/plain',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/**
 * Reads the file extension out of a URL's path.
 *
 * Query strings are excluded deliberately — signed CDN links routinely carry
 * `?v=`, `?token=`, or an expiry, and treating "jpg?token=abc" as an extension
 * would file every one of them as an unknown type.
 */
function extensionOf(rawUrl: string): string {
  try {
    const { pathname } = new URL(rawUrl);
    const match = /\.([a-z0-9]{1,5})$/i.exec(pathname);
    return match ? match[1].toLowerCase() : '';
  } catch {
    return '';
  }
}

function fileNameOf(rawUrl: string): string {
  try {
    const segments = new URL(rawUrl).pathname.split('/').filter(Boolean);
    return decodeURIComponent(segments.at(-1) ?? '') || 'asset';
  } catch {
    return 'asset';
  }
}

const registerSchema = z
  .object({
    url: z.string().url('Enter the full address, including https://'),
    /** Optional: inferred from the file extension when it can be. */
    kind: z.enum(['image', 'video', 'audio', 'document']).optional(),
    /** Required for images. An asset with no alt text cannot be used accessibly. */
    alt: z.string().trim().max(300).default(''),
    caption: z.string().trim().max(500).optional(),
    originalName: z.string().trim().max(260).optional(),
    mimeType: z.string().trim().max(160).optional(),
    sizeBytes: z.number().int().nonnegative().optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    durationSeconds: z.number().nonnegative().optional(),
    brand: z.enum(['h2c', 'gwop', 'kitchen']).default('h2c'),
    tags: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  })
  .strict()
  .superRefine((value, ctx) => {
    const kind = value.kind ?? KIND_BY_EXTENSION[extensionOf(value.url)];
    if (!kind) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['kind'],
        message: 'We could not tell what this is from the link. Choose the type.',
      });
    }
    if (kind === 'image' && !value.alt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['alt'],
        message: 'Describe the image. Alt text is required before it can be used.',
      });
    }
  });

/** Metadata only. The URL is not editable: a different file is a different asset. */
const updateSchema = z
  .object({
    alt: z.string().trim().max(300),
    caption: z.string().trim().max(500),
    brand: z.enum(['h2c', 'gwop', 'kitchen']),
    tags: z.array(z.string().trim().min(1).max(60)).max(20),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    durationSeconds: z.number().nonnegative(),
  })
  .partial()
  .strict();

const listSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(48),
  kind: z.enum(['image', 'video', 'audio', 'document']).optional(),
  brand: z.enum(['h2c', 'gwop', 'kitchen']).optional(),
  tag: z.string().trim().max(60).optional(),
  search: z.string().trim().max(120).optional(),
  /** Archived assets are hidden unless asked for, so the picker stays clean. */
  includeArchived: z.enum(['true', 'false']).default('false'),
});

mediaRouter.get(
  '/',
  requirePermission('media:upload'),
  validateQuery(listSchema),
  asyncHandler(async (req, res) => {
    const q = query<z.infer<typeof listSchema>>(req);

    const filter: Record<string, unknown> = {};
    if (q.kind) filter.kind = q.kind;
    if (q.brand) filter.brand = q.brand;
    if (q.tag) filter.tags = q.tag;
    if (q.includeArchived !== 'true') filter.archivedAt = null;
    if (q.search) {
      const pattern = { $regex: escapeRegex(q.search), $options: 'i' };
      filter.$or = [{ originalName: pattern }, { alt: pattern }, { caption: pattern }];
    }

    const [items, total] = await Promise.all([
      MediaAsset.find(filter)
        .sort({ createdAt: -1 })
        .skip((q.page - 1) * q.pageSize)
        .limit(q.pageSize),
      MediaAsset.countDocuments(filter),
    ]);

    ok(res, page(items, total, q.page, q.pageSize));
  })
);

mediaRouter.get(
  '/:id',
  requirePermission('media:upload'),
  asyncHandler(async (req, res) => {
    const asset = await MediaAsset.findById(req.params.id);
    if (!asset) throw ApiError.notFound();
    ok(res, asset);
  })
);

/**
 * Registers an already-hosted asset.
 *
 * `storageKey` is generated here rather than taken from the request even though
 * nothing is being stored yet: it is the handle the future storage adapter will
 * use, and letting a client choose it now is how a caller ends up able to name
 * — and later address — someone else's object.
 */
mediaRouter.post(
  '/',
  requirePermission('media:upload'),
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof registerSchema>;
    const extension = extensionOf(body.url);

    // Same file registered twice is a duplicate in every picker from then on.
    const existing = await MediaAsset.findOne({ url: body.url, archivedAt: null });
    if (existing) {
      throw ApiError.conflict('That asset is already in the library.');
    }

    const asset = await MediaAsset.create({
      kind: body.kind ?? KIND_BY_EXTENSION[extension],
      url: body.url,
      source: 'external',
      storageKey: `ext_${crypto.randomUUID()}`,
      originalName: body.originalName || fileNameOf(body.url),
      mimeType: body.mimeType || MIME_BY_EXTENSION[extension] || 'application/octet-stream',
      sizeBytes: body.sizeBytes ?? 0,
      alt: body.alt,
      caption: body.caption,
      width: body.width,
      height: body.height,
      durationSeconds: body.durationSeconds,
      brand: body.brand,
      tags: body.tags,
      uploadedBy: req.actor!.id,
    });

    audit(req, 'media-asset.register', 'media-asset', {
      resourceId: String(asset._id),
      meta: { brand: asset.brand, kind: asset.kind },
    });
    created(res, asset, 'Added to the library.');
  })
);

mediaRouter.patch(
  '/:id',
  requirePermission('media:upload'),
  validateBody(updateSchema),
  asyncHandler(async (req, res) => {
    const asset = await MediaAsset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!asset) throw ApiError.notFound();

    audit(req, 'media-asset.update', 'media-asset', {
      resourceId: req.params.id,
      meta: { fields: Object.keys(req.body as object) },
    });
    ok(res, asset, 'Saved.');
  })
);

mediaRouter.delete(
  '/:id',
  requirePermission('media:delete'),
  asyncHandler(async (req, res) => {
    const asset = await MediaAsset.findByIdAndUpdate(
      req.params.id,
      { archivedAt: new Date() },
      { new: true }
    );
    if (!asset) throw ApiError.notFound();

    audit(req, 'media-asset.archive', 'media-asset', { resourceId: req.params.id });
    ok(res, asset, 'Removed from the library. Records already using it still work.');
  })
);

mediaRouter.post(
  '/:id/restore',
  requirePermission('media:delete'),
  asyncHandler(async (req, res) => {
    const asset = await MediaAsset.findByIdAndUpdate(
      req.params.id,
      { archivedAt: null },
      { new: true }
    );
    if (!asset) throw ApiError.notFound();

    audit(req, 'media-asset.restore', 'media-asset', { resourceId: req.params.id });
    ok(res, asset, 'Back in the library.');
  })
);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
