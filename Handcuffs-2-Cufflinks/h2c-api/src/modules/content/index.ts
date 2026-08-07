import { Router } from 'express';
import { crudRouter } from '@/lib/crudRouter';
import {
  ApparelCollection,
  ApparelItem,
  Artist,
  DocuseriesEpisode,
  GwopEvent,
  GwopProgramme,
  Look,
  MusicRelease,
  PodcastClip,
  PodcastEpisode,
} from '@/models/content';
import * as s from './schemas';

/**
 * Content routes.
 *
 * Each entry is the standard CRUD surface with only its differences declared.
 * Kitchen Muzik and GWOP records use their own permissions so those modules can
 * be delegated without granting access to the whole site.
 */
export const contentRouter = Router();

contentRouter.use(
  '/collections',
  crudRouter({
    model: ApparelCollection,
    resource: 'collection',
    createSchema: s.collectionCreate,
    updateSchema: s.collectionUpdate,
    searchFields: ['name', 'premise'],
  })
);

contentRouter.use(
  '/apparel',
  crudRouter({
    model: ApparelItem,
    resource: 'apparel-item',
    createSchema: s.apparelCreate,
    updateSchema: s.apparelUpdate,
    searchFields: ['name', 'story', 'badge'],
  })
);

contentRouter.use(
  '/looks',
  crudRouter({
    model: Look,
    resource: 'look',
    createSchema: s.lookCreate,
    updateSchema: s.lookUpdate,
    searchFields: ['title', 'statement'],
    defaultSort: { lookNumber: 1 },
    slugField: 'lookNumber',
  })
);

contentRouter.use(
  '/docuseries/episodes',
  crudRouter({
    model: DocuseriesEpisode,
    resource: 'docuseries-episode',
    createSchema: s.docuseriesCreate,
    updateSchema: s.docuseriesUpdate,
    searchFields: ['title', 'teaser'],
    defaultSort: { seasonNumber: -1, episodeNumber: -1 },
  })
);

contentRouter.use(
  '/podcast/episodes',
  crudRouter({
    model: PodcastEpisode,
    resource: 'podcast-episode',
    createSchema: s.podcastCreate,
    updateSchema: s.podcastUpdate,
    searchFields: ['title', 'summary'],
    defaultSort: { episodeNumber: -1 },
  })
);

contentRouter.use(
  '/podcast/clips',
  crudRouter({
    model: PodcastClip,
    resource: 'podcast-clip',
    createSchema: s.clipCreate,
    updateSchema: s.clipUpdate,
    searchFields: ['quote', 'attribution'],
    defaultSort: { createdAt: -1 },
    slugField: null,
  })
);

contentRouter.use(
  '/kmm/artists',
  crudRouter({
    model: Artist,
    resource: 'artist',
    createSchema: s.artistCreate,
    updateSchema: s.artistUpdate,
    searchFields: ['name', 'biography'],
    defaultSort: { name: 1 },
    writePermission: 'kmm:manage',
  })
);

contentRouter.use(
  '/kmm/releases',
  crudRouter({
    model: MusicRelease,
    resource: 'music-release',
    createSchema: s.releaseCreate,
    updateSchema: s.releaseUpdate,
    searchFields: ['title', 'note'],
    defaultSort: { releaseDate: -1 },
    writePermission: 'kmm:manage',
  })
);

contentRouter.use(
  '/gwop/programmes',
  crudRouter({
    model: GwopProgramme,
    resource: 'gwop-programme',
    createSchema: s.programmeCreate,
    updateSchema: s.programmeUpdate,
    searchFields: ['name', 'summary'],
    defaultSort: { createdAt: -1 },
    writePermission: 'gwop:manage',
  })
);

contentRouter.use(
  '/gwop/events',
  crudRouter({
    model: GwopEvent,
    resource: 'gwop-event',
    createSchema: s.eventCreate,
    updateSchema: s.eventUpdate,
    searchFields: ['title', 'venue'],
    defaultSort: { startsAt: 1 },
    writePermission: 'gwop:manage',
  })
);
