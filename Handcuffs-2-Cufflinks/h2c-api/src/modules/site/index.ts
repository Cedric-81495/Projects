import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '@/lib/ApiError';
import { asyncHandler } from '@/lib/asyncHandler';
import { crudRouter } from '@/lib/crudRouter';
import { requestSiteRebuild } from '@/lib/deployHook';
import { created, ok } from '@/lib/envelope';
import { audit } from '@/middleware/audit';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { validateBody } from '@/middleware/validate';
import {
  Announcement,
  FounderProfile,
  HeroBanner,
  HomepageSection,
  NavigationMenu,
  RouteSeo,
  SiteSettings,
  StaticPage,
} from '@/models/site';
import * as s from './schemas';

/**
 * Site chrome, structure, and metadata.
 *
 * Permissions split along a line worth stating: content people change copy,
 * super administrators change structure.
 *
 *   content:write / content:publish — announcements, hero banners, homepage
 *     section copy, standing pages. A VA publishing an episode should be able
 *     to update the banner that promotes it without asking anyone.
 *
 *   settings:manage — global settings, navigation, route metadata, and the
 *     order of the homepage. These change the shape of every page at once, and
 *     the guide gives VAs publishing rights, not architectural ones.
 */
export const siteRouter = Router();

/**
 * Runs an upsert, retrying once if it loses a race.
 *
 * Two concurrent upserts against the same unique key do not serialise —
 * MongoDB raises a duplicate-key error for the loser, which the global error
 * handler would turn into a baffling 409 on a save that should simply have
 * worked. Retrying once is sufficient: the document exists by then, so the
 * second attempt is an ordinary update.
 */
async function upsertRetryingOnRace<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    return operation();
  }
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

siteRouter.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    const settings = await SiteSettings.current();
    ok(res, publicSettings(settings));
  })
);

siteRouter.get(
  '/settings/admin',
  requireAuth,
  requirePermission('content:read'),
  asyncHandler(async (_req, res) => {
    ok(res, await SiteSettings.current());
  })
);

siteRouter.patch(
  '/settings',
  requireAuth,
  requirePermission('settings:manage'),
  validateBody(s.settingsUpdate),
  asyncHandler(async (req, res) => {
    const settings = await SiteSettings.current();
    settings.set({ ...req.body, updatedBy: req.actor!.id });
    await settings.save();

    audit(req, 'site.settings.update', 'site-settings', {
      meta: { fields: Object.keys(req.body as object) },
    });
    // Brand copy and default metadata are baked into the prerendered shell.
    requestSiteRebuild('site.settings.update');
    ok(res, settings, 'Site settings saved.');
  })
);

/**
 * Trims the settings document to what a visitor's browser has any business
 * receiving.
 *
 * What goes: `updatedBy` and `singleton`, which are internal bookkeeping, and
 * `phone` and `mailingAddress`, which are the two contact fields a VA is likely
 * to fill in with something not meant for the whole internet.
 *
 * What stays, deliberately: the general, press, and booking email addresses —
 * a booking address nobody can find defeats the speaking-engagement enquiries
 * the guide lists as a KPI — plus `maintenanceMode` and `commerceEnabled`,
 * which the frontend needs in order to render at all.
 */
function publicSettings(doc: Awaited<ReturnType<typeof SiteSettings.current>>) {
  const json = doc.toJSON() as Record<string, unknown>;
  delete json.updatedBy;
  delete json.singleton;

  const contact = json.contact as Record<string, unknown> | undefined;
  if (contact) {
    json.contact = {
      generalEmail: contact.generalEmail,
      pressEmail: contact.pressEmail,
      bookingEmail: contact.bookingEmail,
    };
  }
  return json;
}

/* ------------------------------------------------------------------ */
/* Founder                                                             */
/* ------------------------------------------------------------------ */

siteRouter.get(
  '/founder',
  asyncHandler(async (_req, res) => {
    ok(res, await FounderProfile.current());
  })
);

siteRouter.patch(
  '/founder',
  requireAuth,
  requirePermission('content:write'),
  validateBody(s.founderUpdate),
  asyncHandler(async (req, res) => {
    const profile = await FounderProfile.current();
    profile.set({ ...req.body, updatedBy: req.actor!.id });
    await profile.save();

    audit(req, 'site.founder.update', 'founder-profile', {
      meta: { fields: Object.keys(req.body as object) },
    });
    requestSiteRebuild('site.founder.update');
    ok(res, profile, 'Founder profile saved.');
  })
);

/* ------------------------------------------------------------------ */
/* Announcements                                                       */
/* ------------------------------------------------------------------ */

/**
 * The one announcement a visitor should see right now, or null.
 *
 * Resolved on the server rather than by shipping the whole list and letting the
 * browser filter: the list includes scheduled announcements that have not
 * opened yet, and those are frequently embargoed drop names.
 */
siteRouter.get(
  '/announcements/active',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const announcement = await Announcement.findOne({
      status: 'published',
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] },
      ],
    }).sort({ priority: -1, createdAt: -1 });

    ok(res, announcement);
  })
);

siteRouter.use(
  '/announcements',
  crudRouter({
    model: Announcement,
    resource: 'announcement',
    createSchema: s.announcementCreate,
    updateSchema: s.announcementUpdate,
    searchFields: ['message'],
    defaultSort: { priority: -1, createdAt: -1 },
    slugField: null,
  })
);

/* ------------------------------------------------------------------ */
/* Hero banners                                                        */
/* ------------------------------------------------------------------ */

const placementParam = z.object({ placement: s.heroCreate.shape.placement });

siteRouter.get(
  '/hero-banners/placement/:placement',
  asyncHandler(async (req, res) => {
    const parsed = placementParam.safeParse(req.params);
    if (!parsed.success) throw ApiError.notFound('That is not a page we serve a banner for.');

    const banners = await HeroBanner.find({
      placement: parsed.data.placement,
      status: 'published',
    }).sort({ displayOrder: 1, createdAt: -1 });

    ok(res, banners);
  })
);

siteRouter.use(
  '/hero-banners',
  crudRouter({
    model: HeroBanner,
    resource: 'hero-banner',
    createSchema: s.heroCreate,
    updateSchema: s.heroUpdate,
    searchFields: ['heading', 'eyebrow', 'supportingMessage'],
    defaultSort: { displayOrder: 1, createdAt: -1 },
    slugField: null,
  })
);

/* ------------------------------------------------------------------ */
/* Homepage sections                                                   */
/* ------------------------------------------------------------------ */

siteRouter.get(
  '/homepage',
  asyncHandler(async (_req, res) => {
    const sections = await HomepageSection.find({ isEnabled: true }).sort({ displayOrder: 1 });
    ok(res, sections);
  })
);

siteRouter.get(
  '/homepage/admin',
  requireAuth,
  requirePermission('content:read'),
  asyncHandler(async (_req, res) => {
    ok(res, await HomepageSection.find().sort({ displayOrder: 1 }));
  })
);

siteRouter.post(
  '/homepage',
  requireAuth,
  requirePermission('settings:manage'),
  validateBody(s.homepageSectionCreate),
  asyncHandler(async (req, res) => {
    const body = req.body as { key: string };
    // The key is unique, so this is a 409 rather than a duplicate-key 500. The
    // set of sections is fixed by the guide; you edit one, you do not add a
    // second "founder" block.
    if (await HomepageSection.exists({ key: body.key })) {
      throw ApiError.conflict(`The "${body.key}" section already exists — edit it instead.`);
    }

    const section = await HomepageSection.create(req.body);
    audit(req, 'homepage-section.create', 'homepage-section', { resourceId: String(section._id) });
    requestSiteRebuild('homepage-section.create');
    created(res, section);
  })
);

/**
 * Reorder in one call.
 *
 * A bulkWrite rather than a loop of saves: the homepage order is read as a
 * whole, and a partially applied reorder would render a page with two sections
 * claiming position three. One round trip also means a drag-and-drop CMS screen
 * does not fire twelve requests per drop.
 *
 * Declared above `/homepage/:id` — Express matches in registration order, and
 * the parameterised route would otherwise swallow "reorder" as an id.
 */
siteRouter.patch(
  '/homepage/reorder',
  requireAuth,
  requirePermission('settings:manage'),
  validateBody(s.reorderSchema),
  asyncHandler(async (req, res) => {
    const { order } = req.body as { order: { id: string; displayOrder: number }[] };

    await HomepageSection.bulkWrite(
      order.map(({ id, displayOrder }) => ({
        updateOne: { filter: { _id: id }, update: { $set: { displayOrder } } },
      }))
    );

    audit(req, 'homepage-section.reorder', 'homepage-section', { meta: { count: order.length } });
    requestSiteRebuild('homepage-section.reorder');
    ok(res, await HomepageSection.find().sort({ displayOrder: 1 }), 'Homepage order saved.');
  })
);

siteRouter.patch(
  '/homepage/:id',
  requireAuth,
  requirePermission('content:write'),
  validateBody(s.homepageSectionUpdate),
  asyncHandler(async (req, res) => {
    const section = await HomepageSection.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!section) throw ApiError.notFound();

    audit(req, 'homepage-section.update', 'homepage-section', {
      resourceId: req.params.id,
      meta: { fields: Object.keys(req.body as object) },
    });
    requestSiteRebuild('homepage-section.update');
    ok(res, section);
  })
);

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

siteRouter.get(
  '/navigation',
  asyncHandler(async (_req, res) => {
    const menus = await NavigationMenu.find();
    // Keyed by location: the frontend header, footer, and drawer each want
    // exactly one menu and should not have to scan an array to find it.
    const byLocation = Object.fromEntries(
      menus.map((menu) => [menu.location, visibleItems(menu.toJSON() as MenuJson)])
    );
    ok(res, byLocation);
  })
);

interface MenuJson {
  location: string;
  title?: string;
  items: {
    isVisible: boolean;
    displayOrder: number;
    children: { isVisible: boolean; displayOrder: number }[];
  }[];
}

/**
 * Drops hidden entries and sorts, at both levels.
 *
 * Done here rather than in the query because the items are embedded: Mongo
 * cannot filter inside an array and return the parent in one step without an
 * aggregation, and these documents are small enough that the aggregation would
 * cost more than the filter it replaces.
 */
function visibleItems(menu: MenuJson) {
  return {
    ...menu,
    items: menu.items
      .filter((item) => item.isVisible)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((item) => ({
        ...item,
        children: item.children
          .filter((child) => child.isVisible)
          .sort((a, b) => a.displayOrder - b.displayOrder),
      })),
  };
}

/**
 * Every menu, unfiltered.
 *
 * The public reads above drop hidden entries, which is right for a visitor and
 * wrong for an editor: a CMS that cannot see a hidden item cannot unhide it,
 * and saving the menu would silently delete every entry the editor never knew
 * was there. Declared before `/navigation/:location` so "admin" is not matched
 * as a location.
 */
siteRouter.get(
  '/navigation/admin/all',
  requireAuth,
  requirePermission('content:read'),
  asyncHandler(async (_req, res) => {
    ok(res, await NavigationMenu.find().sort({ location: 1 }));
  })
);

siteRouter.get(
  '/navigation/:location',
  asyncHandler(async (req, res) => {
    const parsed = s.navigationLocation.safeParse(req.params.location);
    if (!parsed.success) throw ApiError.notFound('There is no menu in that position.');

    const menu = await NavigationMenu.findOne({ location: parsed.data });
    if (!menu) throw ApiError.notFound('That menu has not been set up yet.');
    ok(res, visibleItems(menu.toJSON() as MenuJson));
  })
);

siteRouter.put(
  '/navigation/:location',
  requireAuth,
  requirePermission('settings:manage'),
  validateBody(s.navigationUpsert),
  asyncHandler(async (req, res) => {
    const parsed = s.navigationLocation.safeParse(req.params.location);
    if (!parsed.success) throw ApiError.notFound('There is no menu in that position.');

    // PUT, not PATCH: a menu is edited as a whole list, and merging a partial
    // items array into an existing one has no sensible meaning.
    const menu = await upsertRetryingOnRace(() =>
      NavigationMenu.findOneAndUpdate(
        { location: parsed.data },
        { ...req.body, location: parsed.data, updatedBy: req.actor!.id },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      )
    );

    audit(req, 'navigation.update', 'navigation-menu', {
      resourceId: parsed.data,
      meta: { itemCount: (req.body as { items: unknown[] }).items.length },
    });
    requestSiteRebuild('navigation.update');
    ok(res, menu, 'Navigation saved.');
  })
);

/* ------------------------------------------------------------------ */
/* Standing pages                                                      */
/* ------------------------------------------------------------------ */

/**
 * Refuses to archive a page the site structurally depends on.
 *
 * Mounted ahead of the CRUD router so it runs first and then hands over. The
 * cookie notice links to the privacy policy and the footer links to the terms;
 * archiving either leaves a live link pointing at a 404, which for a legal page
 * is worse than an inconvenience.
 */
siteRouter.use(
  '/pages',
  asyncHandler(async (req, _res, next) => {
    if (req.method !== 'DELETE') return next();

    const id = req.path.replace(/^\//, '');
    const page = await StaticPage.findById(id).select('isSystemPage title').catch(() => null);
    if (page?.isSystemPage) {
      throw ApiError.forbidden(
        `"${page.title}" is linked from the site footer and cannot be archived. Edit it instead.`
      );
    }
    next();
  })
);

siteRouter.use(
  '/pages',
  crudRouter({
    model: StaticPage,
    resource: 'static-page',
    createSchema: s.pageCreate,
    updateSchema: s.pageUpdate,
    searchFields: ['title', 'summary'],
    defaultSort: { title: 1 },
  })
);

/* ------------------------------------------------------------------ */
/* Route metadata                                                      */
/* ------------------------------------------------------------------ */

siteRouter.get(
  '/seo',
  asyncHandler(async (req, res) => {
    const raw = typeof req.query.path === 'string' ? req.query.path : '/';
    const path = normalisePath(raw);

    const [override, settings] = await Promise.all([
      RouteSeo.findOne({ path }),
      SiteSettings.current(),
    ]);

    /**
     * Resolution order: the route's own override, then the site defaults, then
     * the brand constants. A route with no record still returns a complete,
     * usable set of tags — an empty <title> is a worse outcome than a generic
     * one, and this is read by crawlers that will not come back.
     */
    const base = settings.defaultSeo ?? {};
    ok(res, {
      path,
      title: override?.seo?.title || base.title || `${settings.brandName} — ${settings.tagline}`,
      description: override?.seo?.description || base.description || settings.missionStatement || '',
      keywords: override?.seo?.keywords?.length ? override.seo.keywords : (base.keywords ?? []),
      ogImageUrl: override?.seo?.ogImageUrl || base.ogImageUrl || '',
      ogImageAlt: override?.seo?.ogImageAlt || base.ogImageAlt || '',
      canonicalUrl: override?.seo?.canonicalUrl || '',
      noIndex: override?.seo?.noIndex ?? false,
      resolvedFrom: override ? 'route' : 'defaults',
    });
  })
);

siteRouter.get(
  '/seo/admin/all',
  requireAuth,
  requirePermission('content:read'),
  asyncHandler(async (_req, res) => {
    ok(res, await RouteSeo.find().sort({ path: 1 }));
  })
);

siteRouter.put(
  '/seo',
  requireAuth,
  requirePermission('settings:manage'),
  validateBody(s.routeSeoUpsert),
  asyncHandler(async (req, res) => {
    const body = req.body as { path: string; seo: Record<string, unknown> };
    const path = normalisePath(body.path);

    const record = await upsertRetryingOnRace(() =>
      RouteSeo.findOneAndUpdate(
        { path },
        { path, seo: body.seo, updatedBy: req.actor!.id },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      )
    );

    audit(req, 'route-seo.update', 'route-seo', { resourceId: path });
    requestSiteRebuild('route-seo.update');
    ok(res, record, 'Metadata saved.');
  })
);

/**
 * One path spelling per route.
 *
 * "/collections", "/collections/", and "Collections" are the same page, and
 * without normalisation each would get its own record — so an editor would fix
 * the metadata and see no change because the site requested the other spelling.
 */
function normalisePath(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const withoutTrailing = withSlash.replace(/\/+$/, '');
  return withoutTrailing || '/';
}

/* ------------------------------------------------------------------ */
/* Bootstrap                                                           */
/* ------------------------------------------------------------------ */

/**
 * Everything the shell needs, in one request.
 *
 * The header, footer, and announcement bar render on every route, and fetching
 * them separately means three round trips before the first paint on a mobile
 * connection — against a guide that names fast and mobile-first as
 * requirements. Content itself is not included: that is per-route and belongs
 * to the route's own fetch.
 */
siteRouter.get(
  '/bootstrap',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const [settings, menus, announcement, sections] = await Promise.all([
      SiteSettings.current(),
      NavigationMenu.find(),
      Announcement.findOne({
        status: 'published',
        $and: [
          { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
          { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] },
        ],
      }).sort({ priority: -1, createdAt: -1 }),
      HomepageSection.find({ isEnabled: true }).sort({ displayOrder: 1 }),
    ]);

    ok(res, {
      settings: publicSettings(settings),
      navigation: Object.fromEntries(
        menus.map((menu) => [menu.location, visibleItems(menu.toJSON() as MenuJson)])
      ),
      announcement,
      homepageSections: sections,
    });
  })
);
