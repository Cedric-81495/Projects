import { ROUTES } from '@/router/routes';
import type { Field } from './fields';
import type { Permission } from '@/types/auth';

/**
 * The record registry.
 *
 * One entry per content type the API exposes through its shared CRUD router.
 * Each declares where it lives, who may edit it, what its list looks like, and
 * what its form contains — and the generic list and edit screens read nothing
 * else. Adding a record type is an entry here, not a new page.
 *
 * Grouping follows the guide's brand architecture rather than data shape: a VA
 * briefed on Kitchen Muzik should find releases under Kitchen Muzik, not under
 * a generic "media" heading shared with the docuseries.
 */

export type ResourceGroup = 'h2c' | 'site' | 'kitchen' | 'gwop';

export interface Column {
  /** Dot path into the record, e.g. "engagement.likes". */
  key: string;
  label: string;
  kind?: 'text' | 'number' | 'date' | 'status' | 'boolean';
  /** Hidden below the tablet breakpoint. */
  secondary?: boolean;
}

export interface ResourceDef {
  /** URL segment under /admin/records. */
  key: string;
  label: string;
  /** Used in buttons: "New collection". */
  singular: string;
  group: ResourceGroup;
  /** API prefix, e.g. "/podcast/episodes". */
  basePath: string;
  writePermission: Permission;
  intro: string;
  columns: Column[];
  fields: Field[];
  /** False for records the API exposes without a publish workflow. */
  publishable?: boolean;
  searchable?: boolean;
  /** Shown on the module index card. */
  blurb: string;
}

/* ------------------------------------------------------------------ */
/* Shared fragments                                                    */
/* ------------------------------------------------------------------ */

const BRAND_OPTIONS = [
  { value: 'h2c', label: 'Handcuffs 2 Cufflinks' },
  { value: 'gwop', label: 'GWOP' },
  { value: 'kitchen', label: 'Kitchen Muzik' },
];

/** The media asset shape used by content records (kind + url + alt). */
function mediaAsset(name: string, label: string, hint?: string): Field {
  return {
    kind: 'group',
    name,
    label,
    hint,
    fields: [
      {
        kind: 'select',
        name: 'kind',
        label: 'Type',
        half: true,
        options: [
          { value: 'image', label: 'Image' },
          { value: 'video', label: 'Video' },
          { value: 'audio', label: 'Audio' },
          { value: 'document', label: 'Document' },
        ],
      },
      { kind: 'select', name: 'brand', label: 'Brand', half: true, options: BRAND_OPTIONS },
      { kind: 'text', name: 'url', label: 'Address', format: 'url', placeholder: 'https://' },
      {
        kind: 'text',
        name: 'alt',
        label: 'Alt text',
        hint: 'Describe what is in the frame. Required for anyone using a screen reader.',
      },
      { kind: 'text', name: 'caption', label: 'Caption' },
    ],
  };
}

/** The simpler image shape the site-chrome endpoints accept (no kind). */
function siteImage(name: string, label: string, hint?: string): Field {
  return {
    kind: 'group',
    name,
    label,
    hint,
    fields: [
      { kind: 'text', name: 'url', label: 'Address', placeholder: 'https:// or /media/…' },
      { kind: 'text', name: 'alt', label: 'Alt text' },
      { kind: 'number', name: 'width', label: 'Width', half: true },
      { kind: 'number', name: 'height', label: 'Height', half: true },
    ],
  };
}

const CTA_FIELDS: Field[] = [
  { kind: 'text', name: 'label', label: 'Button text', half: true, required: true },
  { kind: 'text', name: 'href', label: 'Links to', format: 'path', half: true, placeholder: '/join-the-movement' },
  {
    kind: 'select',
    name: 'variant',
    label: 'Style',
    half: true,
    options: [
      { value: 'gold', label: 'Gold — primary' },
      { value: 'ghost', label: 'Ghost — secondary' },
      { value: 'text', label: 'Text only' },
    ],
  },
  {
    kind: 'boolean',
    name: 'isPrimaryAction',
    label: 'This is the primary action',
    hint: 'Reserve for Join the Movement wherever both appear.',
  },
];

const SEO_FIELD: Field = {
  kind: 'group',
  name: 'seo',
  label: 'Search and social',
  hint: 'Leave blank to inherit the site defaults.',
  fields: [
    { kind: 'text', name: 'title', label: 'Title', maxLength: 70 },
    { kind: 'textarea', name: 'description', label: 'Description', rows: 3, maxLength: 200 },
    { kind: 'tags', name: 'keywords', label: 'Keywords' },
    { kind: 'text', name: 'ogImageUrl', label: 'Share image', format: 'url' },
    { kind: 'text', name: 'ogImageAlt', label: 'Share image alt text' },
    { kind: 'text', name: 'canonicalUrl', label: 'Canonical address', format: 'url' },
    { kind: 'boolean', name: 'noIndex', label: 'Hide from search engines' },
  ],
};

const GUEST_FIELD: Field = {
  kind: 'group',
  name: 'guest',
  label: 'Guest',
  fields: [
    { kind: 'text', name: 'name', label: 'Name', half: true },
    { kind: 'text', name: 'role', label: 'Role or title', half: true },
    { kind: 'textarea', name: 'biography', label: 'Biography', rows: 5 },
    mediaAsset('photo', 'Photo'),
    {
      kind: 'repeater',
      name: 'links',
      label: 'Links',
      itemNoun: 'link',
      fields: [
        { kind: 'text', name: 'label', label: 'Label', half: true },
        { kind: 'text', name: 'url', label: 'Address', format: 'url', half: true },
      ],
    },
  ],
};

const SLUG_FIELD: Field = {
  kind: 'text',
  name: 'slug',
  label: 'Web address',
  format: 'slug',
  required: true,
  half: true,
  hint: 'Lowercase words separated by hyphens. Changing it breaks existing links.',
};

const STATUS_COLUMN: Column = { key: 'status', label: 'Status', kind: 'status' };
const UPDATED_COLUMN: Column = { key: 'updatedAt', label: 'Updated', kind: 'date', secondary: true };

/* ------------------------------------------------------------------ */
/* Records                                                             */
/* ------------------------------------------------------------------ */

export const RESOURCES: ResourceDef[] = [
  {
    key: 'collections',
    label: 'Collections',
    singular: 'collection',
    group: 'h2c',
    basePath: '/collections',
    writePermission: 'content:write',
    blurb: 'The apparel collections the movement is told through.',
    intro:
      'Collections group the apparel into the stories they belong to. They showcase the movement — nothing here sells anything.',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'slug', label: 'Address', secondary: true },
      { key: 'displayOrder', label: 'Order', kind: 'number', secondary: true },
      STATUS_COLUMN,
      UPDATED_COLUMN,
    ],
    fields: [
      { kind: 'text', name: 'name', label: 'Name', required: true, half: true },
      SLUG_FIELD,
      { kind: 'textarea', name: 'premise', label: 'Premise', rows: 3, maxLength: 400, hint: 'One or two lines. What this collection is about.' },
      { kind: 'textarea', name: 'description', label: 'Description', rows: 8 },
      mediaAsset('coverImage', 'Cover image'),
      { kind: 'number', name: 'displayOrder', label: 'Display order', half: true, hint: 'Lower numbers appear first.' },
    ],
  },

  {
    key: 'apparel',
    label: 'Apparel',
    singular: 'piece',
    group: 'h2c',
    basePath: '/apparel',
    writePermission: 'content:write',
    blurb: 'Individual pieces, their meaning, and their engagement figures.',
    intro:
      'Every piece carries its meaning — the story field is required for that reason. Engagement figures below are read-only; they come from what visitors do on the site.',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'badge', label: 'Badge', secondary: true },
      { key: 'engagement.likes', label: 'Likes', kind: 'number', secondary: true },
      { key: 'engagement.votes', label: 'Votes', kind: 'number', secondary: true },
      STATUS_COLUMN,
      UPDATED_COLUMN,
    ],
    fields: [
      { kind: 'text', name: 'name', label: 'Name', required: true, half: true },
      SLUG_FIELD,
      {
        kind: 'text',
        name: 'collectionId',
        label: 'Collection',
        required: true,
        half: true,
        hint: 'The record id of the collection this belongs to.',
      },
      { kind: 'text', name: 'badge', label: 'Badge', half: true, hint: 'Short label on the card, e.g. "Signature".' },
      {
        kind: 'textarea',
        name: 'story',
        label: 'Story',
        rows: 6,
        required: true,
        hint: 'What this piece means. The guide requires it on every item.',
      },
      { kind: 'text', name: 'wearYourStoryMessage', label: '"Wear Your Story" message' },
      {
        kind: 'repeater',
        name: 'images',
        label: 'Photography',
        itemNoun: 'image',
        fields: [
          { kind: 'text', name: 'url', label: 'Address', format: 'url' },
          { kind: 'text', name: 'alt', label: 'Alt text' },
          { kind: 'text', name: 'caption', label: 'Caption', half: true },
          { kind: 'select', name: 'kind', label: 'Type', half: true, options: [{ value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }] },
        ],
      },
      { kind: 'text', name: 'assetSpec', label: 'Asset specification', hint: 'Filename the photographer must deliver, until real imagery lands.' },
      { kind: 'textarea', name: 'fitNotes', label: 'Fit notes', rows: 3 },
      {
        kind: 'repeater',
        name: 'sizes',
        label: 'Sizing',
        itemNoun: 'size',
        fields: [
          { kind: 'text', name: 'size', label: 'Size', half: true },
          { kind: 'text', name: 'chestInches', label: 'Chest (in)', half: true },
          { kind: 'text', name: 'lengthInches', label: 'Length (in)', half: true },
          { kind: 'text', name: 'note', label: 'Note', half: true },
        ],
      },
      { kind: 'tags', name: 'materials', label: 'Materials' },
      { kind: 'tags', name: 'careInstructions', label: 'Care instructions' },
      { kind: 'tags', name: 'relatedItemIds', label: 'Related pieces', hint: 'Record ids, one per line.' },
      { kind: 'number', name: 'displayOrder', label: 'Display order', half: true },
    ],
  },

  {
    key: 'looks',
    label: 'Photoshoot looks',
    singular: 'look',
    group: 'h2c',
    basePath: '/looks',
    writePermission: 'content:write',
    blurb: 'The eight looks the homepage walks visitors through.',
    intro:
      'Numbered so the order carries the narrative arc — use two digits ("01") so 2 sorts before 10.',
    columns: [
      { key: 'lookNumber', label: 'No.' },
      { key: 'title', label: 'Title' },
      STATUS_COLUMN,
      UPDATED_COLUMN,
    ],
    fields: [
      { kind: 'text', name: 'lookNumber', label: 'Look number', required: true, half: true, placeholder: '01' },
      { kind: 'text', name: 'title', label: 'Title', required: true, half: true },
      { kind: 'textarea', name: 'statement', label: 'Statement', rows: 4 },
      mediaAsset('heroImage', 'Hero image'),
      {
        kind: 'repeater',
        name: 'gallery',
        label: 'Gallery',
        itemNoun: 'image',
        fields: [
          { kind: 'text', name: 'url', label: 'Address', format: 'url' },
          { kind: 'text', name: 'alt', label: 'Alt text' },
          { kind: 'select', name: 'kind', label: 'Type', half: true, options: [{ value: 'image', label: 'Image' }] },
        ],
      },
      { kind: 'tags', name: 'pieces', label: 'Pieces in this look', hint: 'One per line, as worn.' },
      { kind: 'tags', name: 'itemIds', label: 'Linked apparel ids' },
    ],
  },

  {
    key: 'docuseries',
    label: 'Docuseries',
    singular: 'episode',
    group: 'h2c',
    basePath: '/docuseries/episodes',
    writePermission: 'content:write',
    blurb: 'Transformation stories, told long-form.',
    intro:
      'Each episode needs exactly three key lessons — the guide specifies three, and the API enforces it. Video is embedded rather than linked away.',
    columns: [
      { key: 'episodeNumber', label: 'No.' },
      { key: 'title', label: 'Title' },
      { key: 'seasonNumber', label: 'Season', kind: 'number', secondary: true },
      { key: 'isFeatured', label: 'Featured', kind: 'boolean', secondary: true },
      STATUS_COLUMN,
      UPDATED_COLUMN,
    ],
    fields: [
      { kind: 'text', name: 'title', label: 'Title', required: true },
      SLUG_FIELD,
      { kind: 'text', name: 'episodeNumber', label: 'Episode number', half: true },
      { kind: 'number', name: 'seasonNumber', label: 'Season', half: true },
      { kind: 'text', name: 'youtubeVideoId', label: 'YouTube video id', half: true, hint: 'The id only, not the whole address.' },
      { kind: 'text', name: 'runtimeLabel', label: 'Runtime', half: true, placeholder: '24 min' },
      { kind: 'textarea', name: 'teaser', label: 'Teaser', rows: 3, maxLength: 600 },
      mediaAsset('heroImage', 'Hero image'),
      GUEST_FIELD,
      { kind: 'textarea', name: 'definingStruggle', label: 'Defining struggle', rows: 6 },
      { kind: 'textarea', name: 'transformationStory', label: 'Transformation story', rows: 10 },
      { kind: 'tags', name: 'keyLessons', label: 'Three key lessons', max: 3, hint: 'Exactly three, one per line.' },
      { kind: 'tags', name: 'relatedApparelIds', label: 'Related apparel ids' },
      { kind: 'boolean', name: 'isFeatured', label: 'Feature this episode on the homepage' },
    ],
  },

  {
    key: 'podcast-episodes',
    label: 'Podcast episodes',
    singular: 'episode',
    group: 'h2c',
    basePath: '/podcast/episodes',
    writePermission: 'content:write',
    blurb: 'Full episodes, guests, and platform links.',
    intro: 'Published weekly. Key takeaways appear beneath the player.',
    columns: [
      { key: 'episodeNumber', label: 'No.' },
      { key: 'title', label: 'Title' },
      { key: 'isFeatured', label: 'Featured', kind: 'boolean', secondary: true },
      STATUS_COLUMN,
      UPDATED_COLUMN,
    ],
    fields: [
      { kind: 'text', name: 'title', label: 'Title', required: true },
      SLUG_FIELD,
      { kind: 'text', name: 'episodeNumber', label: 'Episode number', half: true },
      { kind: 'text', name: 'youtubeVideoId', label: 'YouTube video id', half: true },
      { kind: 'number', name: 'durationSeconds', label: 'Duration in seconds', half: true },
      { kind: 'textarea', name: 'summary', label: 'Summary', rows: 5 },
      mediaAsset('coverImage', 'Cover image'),
      GUEST_FIELD,
      { kind: 'tags', name: 'keyTakeaways', label: 'Key takeaways' },
      {
        kind: 'repeater',
        name: 'audioPlatformLinks',
        label: 'Listen on',
        itemNoun: 'platform',
        fields: [
          { kind: 'text', name: 'platform', label: 'Platform', half: true, placeholder: 'spotify' },
          { kind: 'text', name: 'label', label: 'Label', half: true },
          { kind: 'text', name: 'url', label: 'Address', format: 'url' },
        ],
      },
      { kind: 'boolean', name: 'isFeatured', label: 'Feature this episode' },
    ],
  },

  {
    key: 'podcast-clips',
    label: 'Podcast clips',
    singular: 'clip',
    group: 'h2c',
    basePath: '/podcast/clips',
    writePermission: 'content:write',
    blurb: 'Short quotes reused across the site.',
    intro:
      'Clips appear wherever their placements say they should — the same quote can carry the podcast page and the homepage without being duplicated.',
    columns: [
      { key: 'attribution', label: 'Said by' },
      { key: 'quote', label: 'Quote' },
      STATUS_COLUMN,
      UPDATED_COLUMN,
    ],
    fields: [
      { kind: 'textarea', name: 'quote', label: 'Quote', rows: 3, required: true },
      { kind: 'text', name: 'attribution', label: 'Said by', required: true, half: true },
      {
        kind: 'text',
        name: 'episodeId',
        label: 'Episode id',
        format: 'id',
        half: true,
        hint: 'Optional. Links the clip back to its full episode.',
      },
      { kind: 'text', name: 'youtubeVideoId', label: 'YouTube video id', half: true },
      { kind: 'number', name: 'startSeconds', label: 'Start (seconds)', half: true },
      { kind: 'number', name: 'endSeconds', label: 'End (seconds)', half: true },
      {
        kind: 'tags',
        name: 'placements',
        label: 'Placements',
        hint: 'One per line: home, podcast, movement, community.',
      },
    ],
  },

  /* ---------------------------- Site chrome --------------------------- */

  {
    key: 'announcements',
    label: 'Announcements',
    singular: 'announcement',
    group: 'site',
    basePath: '/site/announcements',
    writePermission: 'content:write',
    blurb: 'The bar above the header. Time-bounded, so it retires itself.',
    intro:
      'One announcement shows at a time — the published one with the highest priority whose window is open. Leave the dates blank for "until I turn it off".',
    columns: [
      { key: 'message', label: 'Message' },
      { key: 'priority', label: 'Priority', kind: 'number', secondary: true },
      { key: 'startsAt', label: 'Opens', kind: 'date', secondary: true },
      { key: 'endsAt', label: 'Closes', kind: 'date', secondary: true },
      STATUS_COLUMN,
    ],
    fields: [
      { kind: 'text', name: 'message', label: 'Message', required: true, maxLength: 160 },
      { kind: 'text', name: 'linkLabel', label: 'Link text', half: true },
      { kind: 'text', name: 'linkHref', label: 'Links to', format: 'path', half: true },
      {
        kind: 'select',
        name: 'tone',
        label: 'Tone',
        half: true,
        options: [
          { value: 'emerald', label: 'Emerald' },
          { value: 'gold', label: 'Gold' },
          { value: 'pitch', label: 'Pitch' },
        ],
      },
      { kind: 'number', name: 'priority', label: 'Priority', half: true, min: 0, max: 100, hint: 'Higher wins when two are live.' },
      { kind: 'date', name: 'startsAt', label: 'Opens', withTime: true, nullable: true, half: true },
      { kind: 'date', name: 'endsAt', label: 'Closes', withTime: true, nullable: true, half: true },
      { kind: 'boolean', name: 'dismissible', label: 'Visitors can dismiss it' },
    ],
  },

  {
    key: 'hero-banners',
    label: 'Hero banners',
    singular: 'banner',
    group: 'site',
    basePath: '/site/hero-banners',
    writePermission: 'content:write',
    blurb: 'The opening frame on each major page.',
    intro: 'One banner per placement is the usual case; extras are ordered by display order.',
    columns: [
      { key: 'placement', label: 'Page' },
      { key: 'heading', label: 'Heading' },
      { key: 'displayOrder', label: 'Order', kind: 'number', secondary: true },
      STATUS_COLUMN,
    ],
    fields: [
      {
        kind: 'select',
        name: 'placement',
        label: 'Page',
        required: true,
        half: true,
        options: [
          { value: 'home', label: 'Home' },
          { value: 'movement', label: 'The Movement' },
          { value: 'collections', label: 'Collections' },
          { value: 'docuseries', label: 'Docuseries' },
          { value: 'podcast', label: 'Podcast' },
          { value: 'music', label: 'Music' },
          { value: 'gwop', label: 'GWOP' },
          { value: 'community', label: 'Community' },
          { value: 'founder', label: 'About the Founder' },
          { value: 'join', label: 'Join the Movement' },
        ],
      },
      { kind: 'number', name: 'displayOrder', label: 'Display order', half: true },
      { kind: 'text', name: 'eyebrow', label: 'Eyebrow', half: true },
      { kind: 'text', name: 'heading', label: 'Heading', required: true },
      { kind: 'textarea', name: 'supportingMessage', label: 'Supporting message', rows: 3 },
      siteImage('image', 'Background image'),
      { kind: 'text', name: 'videoUrl', label: 'Background video', format: 'url' },
      { kind: 'text', name: 'youtubeVideoId', label: 'YouTube video id', half: true },
      {
        kind: 'number',
        name: 'scrimStrength',
        label: 'Scrim strength',
        half: true,
        min: 0,
        max: 100,
        hint: 'How far the image is darkened so text stays legible.',
      },
      { kind: 'repeater', name: 'ctas', label: 'Buttons', itemNoun: 'button', max: 3, fields: CTA_FIELDS },
    ],
  },

  {
    key: 'pages',
    label: 'Standing pages',
    singular: 'page',
    group: 'site',
    basePath: '/site/pages',
    writePermission: 'content:write',
    blurb: 'Privacy, terms, and anything else that needs its own address.',
    intro:
      'Pages are built from typed blocks rather than raw HTML — CMS-authored HTML rendered on the site is stored cross-site scripting. Pages the footer links to cannot be archived.',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'slug', label: 'Address', secondary: true },
      { key: 'isSystemPage', label: 'Linked in footer', kind: 'boolean', secondary: true },
      STATUS_COLUMN,
      UPDATED_COLUMN,
    ],
    fields: [
      { kind: 'text', name: 'title', label: 'Title', required: true, half: true },
      SLUG_FIELD,
      { kind: 'textarea', name: 'summary', label: 'Summary', rows: 3 },
      {
        kind: 'repeater',
        name: 'blocks',
        label: 'Content',
        itemNoun: 'block',
        fields: [
          {
            kind: 'select',
            name: 'type',
            label: 'Block type',
            half: true,
            options: [
              { value: 'paragraph', label: 'Paragraph' },
              { value: 'heading', label: 'Heading' },
              { value: 'list', label: 'List' },
              { value: 'quote', label: 'Quote' },
              { value: 'image', label: 'Image' },
              { value: 'video', label: 'Video' },
              { value: 'cta', label: 'Call to action' },
              { value: 'divider', label: 'Divider' },
            ],
          },
          { kind: 'number', name: 'level', label: 'Heading level', half: true, min: 2, max: 4 },
          { kind: 'textarea', name: 'text', label: 'Text', rows: 4 },
          { kind: 'tags', name: 'items', label: 'List items' },
          { kind: 'text', name: 'attribution', label: 'Attribution', half: true },
          { kind: 'text', name: 'youtubeVideoId', label: 'YouTube video id', half: true },
          siteImage('image', 'Image'),
          { kind: 'group', name: 'cta', label: 'Call to action', fields: CTA_FIELDS },
        ],
      },
      SEO_FIELD,
    ],
  },

  /* -------------------------- Kitchen Muzik --------------------------- */

  {
    key: 'artists',
    label: 'Artists',
    singular: 'artist',
    group: 'kitchen',
    basePath: '/kmm/artists',
    writePermission: 'kmm:manage',
    blurb: 'The roster, their biographies, and their socials.',
    intro: 'Artist development is Kitchen Muzik Management’s side of the ecosystem; these records stay under its own permission.',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'city', label: 'City', secondary: true },
      { key: 'activeStatus', label: 'Roster', secondary: true },
      STATUS_COLUMN,
      UPDATED_COLUMN,
    ],
    fields: [
      { kind: 'text', name: 'name', label: 'Name', required: true, half: true },
      SLUG_FIELD,
      { kind: 'text', name: 'city', label: 'City', half: true },
      { kind: 'text', name: 'activeSince', label: 'Active since', half: true },
      {
        kind: 'select',
        name: 'activeStatus',
        label: 'Roster status',
        half: true,
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
      },
      { kind: 'textarea', name: 'biography', label: 'Biography', rows: 10 },
      {
        kind: 'repeater',
        name: 'images',
        label: 'Images',
        itemNoun: 'image',
        fields: [
          { kind: 'text', name: 'url', label: 'Address', format: 'url' },
          { kind: 'text', name: 'alt', label: 'Alt text' },
          { kind: 'select', name: 'kind', label: 'Type', half: true, options: [{ value: 'image', label: 'Image' }] },
          { kind: 'select', name: 'brand', label: 'Brand', half: true, options: BRAND_OPTIONS },
        ],
      },
      {
        kind: 'repeater',
        name: 'socialLinks',
        label: 'Social links',
        itemNoun: 'link',
        fields: [
          { kind: 'text', name: 'platform', label: 'Platform', half: true },
          { kind: 'text', name: 'url', label: 'Address', format: 'url', half: true },
        ],
      },
    ],
  },

  {
    key: 'releases',
    label: 'Releases',
    singular: 'release',
    group: 'kitchen',
    basePath: '/kmm/releases',
    writePermission: 'kmm:manage',
    blurb: 'Singles, albums, mixtapes, music videos, and their credits.',
    intro: 'The soundtrack of the transformation. Credits and copyright live with the release, not in a separate ledger.',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type', secondary: true },
      { key: 'releaseDate', label: 'Released', kind: 'date', secondary: true },
      { key: 'isFeatured', label: 'Featured', kind: 'boolean', secondary: true },
      STATUS_COLUMN,
    ],
    fields: [
      { kind: 'text', name: 'title', label: 'Title', required: true, half: true },
      SLUG_FIELD,
      {
        kind: 'select',
        name: 'type',
        label: 'Type',
        required: true,
        half: true,
        options: [
          { value: 'single', label: 'Single' },
          { value: 'album', label: 'Album' },
          { value: 'mixtape', label: 'Mixtape' },
          { value: 'music-video', label: 'Music video' },
        ],
      },
      { kind: 'date', name: 'releaseDate', label: 'Release date', nullable: true, half: true },
      { kind: 'tags', name: 'artistNames', label: 'Artists' },
      { kind: 'tags', name: 'artistIds', label: 'Artist record ids' },
      { kind: 'tags', name: 'genres', label: 'Genres' },
      mediaAsset('coverArt', 'Cover art'),
      { kind: 'text', name: 'youtubeVideoId', label: 'YouTube video id', half: true },
      { kind: 'textarea', name: 'note', label: 'Note', rows: 4 },
      { kind: 'textarea', name: 'lyrics', label: 'Lyrics', rows: 10 },
      {
        kind: 'repeater',
        name: 'streamingLinks',
        label: 'Streaming links',
        itemNoun: 'platform',
        fields: [
          { kind: 'text', name: 'platform', label: 'Platform', half: true },
          { kind: 'text', name: 'label', label: 'Label', half: true },
          { kind: 'text', name: 'url', label: 'Address', format: 'url' },
        ],
      },
      {
        kind: 'group',
        name: 'credits',
        label: 'Production credits',
        fields: [
          { kind: 'tags', name: 'producers', label: 'Producers' },
          { kind: 'tags', name: 'songwriters', label: 'Songwriters' },
          { kind: 'tags', name: 'collaborators', label: 'Collaborators' },
          { kind: 'tags', name: 'recordingStudios', label: 'Recording studios' },
          { kind: 'text', name: 'copyrightNotice', label: 'Copyright notice' },
        ],
      },
      { kind: 'boolean', name: 'isFeatured', label: 'Feature this release' },
    ],
  },

  /* ------------------------------ GWOP -------------------------------- */

  {
    key: 'programmes',
    label: 'Programmes',
    singular: 'programme',
    group: 'gwop',
    basePath: '/gwop/programmes',
    writePermission: 'gwop:manage',
    blurb: 'Courses, workshops, seminars, mentorship, and initiatives.',
    intro: 'GWOP is the education and mentorship arm. Programmes carry their own permission so the module can be delegated.',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'kind', label: 'Kind', secondary: true },
      { key: 'enrolledCount', label: 'Enrolled', kind: 'number', secondary: true },
      { key: 'capacity', label: 'Capacity', kind: 'number', secondary: true },
      STATUS_COLUMN,
    ],
    fields: [
      { kind: 'text', name: 'name', label: 'Name', required: true, half: true },
      SLUG_FIELD,
      {
        kind: 'select',
        name: 'kind',
        label: 'Kind',
        required: true,
        half: true,
        options: [
          { value: 'Course', label: 'Course' },
          { value: 'Workshop', label: 'Workshop' },
          { value: 'Seminar', label: 'Seminar' },
          { value: 'Mentorship', label: 'Mentorship' },
          { value: 'Initiative', label: 'Initiative' },
        ],
      },
      { kind: 'text', name: 'length', label: 'Length', half: true, placeholder: '6 weeks' },
      { kind: 'number', name: 'capacity', label: 'Capacity', half: true },
      { kind: 'textarea', name: 'summary', label: 'Summary', rows: 3 },
      { kind: 'textarea', name: 'description', label: 'Description', rows: 10 },
      { kind: 'tags', name: 'outcomes', label: 'Outcomes' },
      { kind: 'textarea', name: 'eligibility', label: 'Who it is for', rows: 4 },
      mediaAsset('coverImage', 'Cover image'),
    ],
  },

  {
    key: 'events',
    label: 'Events',
    singular: 'event',
    group: 'gwop',
    basePath: '/gwop/events',
    writePermission: 'gwop:manage',
    blurb: 'Schedules, venues, speakers, and registration.',
    intro: 'Events are ordered by start time, soonest first.',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'startsAt', label: 'Starts', kind: 'date' },
      { key: 'venue', label: 'Venue', secondary: true },
      { key: 'registeredCount', label: 'Registered', kind: 'number', secondary: true },
      STATUS_COLUMN,
    ],
    fields: [
      { kind: 'text', name: 'title', label: 'Title', required: true, half: true },
      SLUG_FIELD,
      { kind: 'date', name: 'startsAt', label: 'Starts', withTime: true, required: true, half: true },
      { kind: 'date', name: 'endsAt', label: 'Ends', withTime: true, half: true },
      { kind: 'text', name: 'venue', label: 'Venue', half: true },
      { kind: 'number', name: 'capacity', label: 'Capacity', half: true },
      { kind: 'textarea', name: 'address', label: 'Address', rows: 3 },
      { kind: 'tags', name: 'speakers', label: 'Speakers' },
      { kind: 'text', name: 'registrationUrl', label: 'Registration link', format: 'url' },
    ],
  },
];

export const GROUP_LABEL: Record<ResourceGroup, string> = {
  h2c: 'Handcuffs 2 Cufflinks',
  site: 'Website',
  kitchen: 'Kitchen Muzik Management',
  gwop: 'GWOP',
};

/** Where "back" goes from a record screen. Site records live inside the parent brand's module. */
export const MODULE_ROUTE: Record<ResourceGroup, string> = {
  h2c: ROUTES.adminH2C,
  site: ROUTES.adminH2C,
  kitchen: ROUTES.adminKitchen,
  gwop: ROUTES.adminGwop,
};

export function findResource(key: string | undefined): ResourceDef | undefined {
  return RESOURCES.find((resource) => resource.key === key);
}

export function resourcesInGroup(group: ResourceGroup): ResourceDef[] {
  return RESOURCES.filter((resource) => resource.group === group);
}
