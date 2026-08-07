import { Router } from 'express';
import type { Model } from 'mongoose';
import { z } from 'zod';
import { ApiError } from '@/lib/ApiError';
import { asyncHandler } from '@/lib/asyncHandler';
import { created, ok, page } from '@/lib/envelope';
import { requestSiteRebuild } from '@/lib/deployHook';
import { audit } from '@/middleware/audit';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { query, validateBody, validateQuery } from '@/middleware/validate';
import type { Permission } from '@/types/auth';

/**
 * Standard content router.
 *
 * Thirteen content types need the same read/write/publish/delete surface. Doing
 * that by hand thirteen times is thirteen opportunities to forget a permission
 * check or leak a draft, so the shape is defined once here and each module
 * supplies only what differs.
 *
 * Two rules are enforced structurally rather than per module:
 *   - Public reads only ever return published documents.
 *   - Publishing and deleting are separate permissions from writing, so a VA
 *     can edit and publish without being able to destroy records.
 */

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
  search: z.string().trim().max(120).optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'archived']).optional(),
  featured: z.enum(['true', 'false']).optional(),
});

type ListQuery = z.infer<typeof listQuerySchema>;

export interface CrudOptions<T> {
  model: Model<T>;
  /** Used in audit entries, e.g. "docuseries-episode". */
  resource: string;
  createSchema: z.ZodSchema;
  updateSchema: z.ZodSchema;
  /** Fields matched by the public search parameter. */
  searchFields?: string[];
  defaultSort?: Record<string, 1 | -1>;
  /** Permission for write operations. Defaults to content:write. */
  writePermission?: Permission;
  /** Look-ups by this field as well as by id. */
  slugField?: string | null;
  /** Extra filter applied to every public read. */
  publicFilter?: Record<string, unknown>;
}

export function crudRouter<T>(options: CrudOptions<T>): Router {
  const {
    model,
    resource,
    createSchema,
    updateSchema,
    searchFields = ['name', 'title'],
    defaultSort = { displayOrder: 1, createdAt: -1 },
    writePermission = 'content:write',
    slugField = 'slug',
    publicFilter = {},
  } = options;

  const router = Router();

  const byIdOrSlug = (value: string): Record<string, unknown> => {
    const isObjectId = /^[a-f\d]{24}$/i.test(value);
    if (isObjectId) return { _id: value };
    if (slugField) return { [slugField]: value.toLowerCase() };
    throw ApiError.notFound();
  };

  /* ---------------------------------------------------------------- */
  /* Public reads — published documents only                           */
  /* ---------------------------------------------------------------- */

  router.get(
    '/',
    validateQuery(listQuerySchema),
    asyncHandler(async (req, res) => {
      const q = query<ListQuery>(req);
      const filter: Record<string, unknown> = { status: 'published', ...publicFilter };

      if (q.search && searchFields.length) {
        filter.$or = searchFields.map((field) => ({
          [field]: { $regex: escapeRegex(q.search!), $options: 'i' },
        }));
      }
      if (q.featured) filter.isFeatured = q.featured === 'true';

      const [items, total] = await Promise.all([
        model.find(filter).sort(defaultSort).skip((q.page - 1) * q.pageSize).limit(q.pageSize),
        model.countDocuments(filter),
      ]);

      ok(res, page(items, total, q.page, q.pageSize));
    })
  );

  router.get(
    '/:idOrSlug',
    asyncHandler(async (req, res) => {
      const doc = await model.findOne({
        ...byIdOrSlug(req.params.idOrSlug),
        status: 'published',
        ...publicFilter,
      });
      if (!doc) throw ApiError.notFound();
      ok(res, doc);
    })
  );

  /* ---------------------------------------------------------------- */
  /* Admin                                                             */
  /* ---------------------------------------------------------------- */

  /** Includes drafts, so it is gated behind content:read. */
  router.get(
    '/admin/all',
    requireAuth,
    requirePermission('content:read'),
    validateQuery(listQuerySchema),
    asyncHandler(async (req, res) => {
      const q = query<ListQuery>(req);
      const filter: Record<string, unknown> = {};
      if (q.status) filter.status = q.status;
      if (q.search && searchFields.length) {
        filter.$or = searchFields.map((field) => ({
          [field]: { $regex: escapeRegex(q.search!), $options: 'i' },
        }));
      }

      const [items, total] = await Promise.all([
        model.find(filter).sort(defaultSort).skip((q.page - 1) * q.pageSize).limit(q.pageSize),
        model.countDocuments(filter),
      ]);

      ok(res, page(items, total, q.page, q.pageSize));
    })
  );

  router.get(
    '/admin/:idOrSlug',
    requireAuth,
    requirePermission('content:read'),
    asyncHandler(async (req, res) => {
      const doc = await model.findOne(byIdOrSlug(req.params.idOrSlug));
      if (!doc) throw ApiError.notFound();
      ok(res, doc);
    })
  );

  router.post(
    '/',
    requireAuth,
    requirePermission(writePermission),
    validateBody(createSchema),
    asyncHandler(async (req, res) => {
      // Always created as a draft. Publishing is a separate, audited action.
      const doc = await model.create({ ...req.body, status: 'draft' });
      audit(req, `${resource}.create`, resource, { resourceId: String(doc._id) });
      created(res, doc);
    })
  );

  router.patch(
    '/:id',
    requireAuth,
    requirePermission(writePermission),
    validateBody(updateSchema),
    asyncHandler(async (req, res) => {
      const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!doc) throw ApiError.notFound();

      audit(req, `${resource}.update`, resource, {
        resourceId: req.params.id,
        meta: { fields: Object.keys(req.body as object) },
      });

      // Editing already-public content changes what crawlers should see.
      if ((doc as { status?: string }).status === 'published') {
        requestSiteRebuild(`${resource}.update`);
      }
      ok(res, doc);
    })
  );

  router.post(
    '/:id/publish',
    requireAuth,
    requirePermission('content:publish'),
    asyncHandler(async (req, res) => {
      const doc = await model.findByIdAndUpdate(
        req.params.id,
        { status: 'published', publishedAt: new Date(), scheduledFor: null },
        { new: true, runValidators: true }
      );
      if (!doc) throw ApiError.notFound();

      audit(req, `${resource}.publish`, resource, { resourceId: req.params.id });
      requestSiteRebuild(`${resource}.publish`);
      ok(res, doc, 'Published. It is live for visitors now; social previews refresh shortly.');
    })
  );

  router.post(
    '/:id/unpublish',
    requireAuth,
    requirePermission('content:publish'),
    asyncHandler(async (req, res) => {
      const doc = await model.findByIdAndUpdate(
        req.params.id,
        { status: 'draft', publishedAt: null },
        { new: true }
      );
      if (!doc) throw ApiError.notFound();

      audit(req, `${resource}.unpublish`, resource, { resourceId: req.params.id });
      requestSiteRebuild(`${resource}.unpublish`);
      ok(res, doc);
    })
  );

  /**
   * Archive rather than delete. Content here is other people's stories; a
   * misclick should not destroy one. Hard deletion is a database operation
   * performed deliberately, not an API call.
   */
  router.delete(
    '/:id',
    requireAuth,
    requirePermission('content:delete'),
    asyncHandler(async (req, res) => {
      const doc = await model.findByIdAndUpdate(
        req.params.id,
        { status: 'archived', publishedAt: null },
        { new: true }
      );
      if (!doc) throw ApiError.notFound();

      audit(req, `${resource}.archive`, resource, { resourceId: req.params.id });
      requestSiteRebuild(`${resource}.archive`);
      ok(res, doc, 'Archived. It is hidden from the site but not destroyed.');
    })
  );

  return router;
}

/** Prevents user input from being interpreted as a regular expression. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
