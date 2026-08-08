/**
 * CMS contract check.
 *
 * The admin screens are driven by a field registry rather than hand-written
 * forms, which makes them cheap to add and easy to get subtly wrong: a field
 * named `episode_id` instead of `episodeId` compiles, renders, and fails only
 * when someone tries to save. There is no type link across the two packages to
 * catch it, and no Mongo instance in CI to catch it with an integration test.
 *
 * So this compares the two sides directly. Both are bundled with esbuild and
 * imported, so the real modules are checked rather than a hand-copied list that
 * would drift from whichever side changed last.
 *
 * Three things are asserted:
 *   1. Every route the admin calls is registered on the API router.
 *   2. Every field name in a form is a key its schema accepts.
 *   3. An untouched form produces no nested validation errors — the failure
 *      mode where a blank optional sub-object is posted as `{ url: '' }` and
 *      rejected for an address nobody typed.
 *
 *   npm run verify:cms
 */
import { build } from 'esbuild';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = path.resolve(WEB, '../h2c-api');

// The API module graph reads its configuration at import time and refuses to
// load without these. Nothing here connects to anything; they only have to be
// well-formed.
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/contract-check';
process.env.JWT_ACCESS_SECRET ??= 'contract-check-access-secret-not-a-real-key';
process.env.JWT_REFRESH_SECRET ??= 'contract-check-refresh-secret-not-a-real-key';

function aliasPlugin(base) {
  return {
    name: 'alias',
    setup(pluginBuild) {
      pluginBuild.onResolve({ filter: /^@\// }, (args) => {
        const target = path.join(base, args.path.slice(2));
        for (const suffix of ['.ts', '.tsx', '/index.ts', '']) {
          const candidate = target + suffix;
          if (existsSync(candidate) && statSync(candidate).isFile()) return { path: candidate };
        }
        return { path: target };
      });
    },
  };
}

/**
 * Output lands in the owning package's node_modules/.cache rather than a temp
 * directory, so bare imports left external (zod, express) resolve against that
 * package's own dependencies — Node resolves from the file's location, not the
 * process's working directory.
 */
async function bundle(entry, aliasBase, ownerPackage, name) {
  const dir = path.join(ownerPackage, 'node_modules/.cache/cms-contract');
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.mjs`);

  await build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile: file,
    packages: 'external',
    plugins: [aliasPlugin(aliasBase)],
    logLevel: 'silent',
  });

  return import(`${file}?t=${Date.now()}`);
}

const apiEntry = path.join(API, 'node_modules/.cache/cms-contract/entry.ts');
mkdirSync(path.dirname(apiEntry), { recursive: true });
writeFileSync(
  apiEntry,
  `export * as content from '@/modules/content/schemas';
export * as site from '@/modules/site/schemas';
export { apiRouter } from '@/routes/index';
`
);

const api = await bundle(apiEntry, path.join(API, 'src'), API, 'api');
const web = await bundle(
  path.join(WEB, 'src/features/admin/lib/resources.ts'),
  path.join(WEB, 'src'),
  WEB,
  'resources'
);
const fields = await bundle(
  path.join(WEB, 'src/features/admin/lib/fields.ts'),
  path.join(WEB, 'src'),
  WEB,
  'fields'
);

const failures = [];

/* ------------------------------------------------------------------ */
/* 1. Routes                                                           */
/* ------------------------------------------------------------------ */

/**
 * Recovers a sub-router's mount path from its compiled pattern.
 *
 * Express keeps no record of the string a router was mounted at, so the pattern
 * is the only evidence. `fast_slash` marks a router mounted at the root, whose
 * pattern matches everything and would otherwise read as a literal "/".
 */
function mountPathOf(layer) {
  if (layer.regexp?.fast_slash) return '';
  return layer.regexp.source
    .replace(/^\^/, '')
    .replace(/\\\/\?\(\?=\\\/\|\$\)$/, '')
    .replace(/\\\/\?\$$/, '')
    .replace(/\\\//g, '/');
}

const routes = new Set();
(function walk(stack, prefix) {
  for (const layer of stack) {
    if (layer.route) {
      for (const method of Object.keys(layer.route.methods)) {
        routes.add(`${method.toUpperCase()} ${prefix}${layer.route.path}`.replace(/\/$/, ''));
      }
    } else if (layer.handle?.stack) {
      walk(layer.handle.stack, prefix + mountPathOf(layer));
    }
  }
})(api.apiRouter.stack, '');

const expect = (method, pathname, context) => {
  if (!routes.has(`${method} ${pathname}`.replace(/\/$/, ''))) {
    failures.push(`missing route${context ? ` for ${context}` : ''}: ${method} ${pathname}`);
  }
};

for (const resource of web.RESOURCES) {
  const base = resource.basePath;
  expect('GET', `${base}/admin/all`, resource.key);
  expect('GET', `${base}/admin/:idOrSlug`, resource.key);
  expect('POST', base, resource.key);
  expect('PATCH', `${base}/:id`, resource.key);
  expect('POST', `${base}/:id/publish`, resource.key);
  expect('POST', `${base}/:id/unpublish`, resource.key);
  expect('DELETE', `${base}/:id`, resource.key);
}

/** The screens that are not record lists and so have no registry entry. */
for (const [method, pathname] of [
  ['GET', '/media'],
  ['POST', '/media'],
  ['PATCH', '/media/:id'],
  ['DELETE', '/media/:id'],
  ['POST', '/media/:id/restore'],
  ['GET', '/site/settings/admin'],
  ['PATCH', '/site/settings'],
  ['GET', '/site/founder'],
  ['PATCH', '/site/founder'],
  ['GET', '/site/homepage/admin'],
  ['POST', '/site/homepage'],
  ['PATCH', '/site/homepage/reorder'],
  ['PATCH', '/site/homepage/:id'],
  ['GET', '/site/navigation/admin/all'],
  ['PUT', '/site/navigation/:location'],
  ['GET', '/site/seo/admin/all'],
  ['PUT', '/site/seo'],
  ['GET', '/community/stories/admin/all'],
  ['POST', '/community/stories/:id/moderate'],
  ['GET', '/community/guest-nominations'],
  ['GET', '/community/applications'],
  ['GET', '/subscribers'],
  ['GET', '/subscribers/export'],
  ['GET', '/users'],
  ['POST', '/users'],
  ['PATCH', '/users/:id/role'],
  ['PATCH', '/users/:id/status'],
  ['GET', '/users/audit-log'],
  ['GET', '/analytics/dashboard'],
]) {
  expect(method, pathname);
}

/* ------------------------------------------------------------------ */
/* 2. Field names                                                      */
/* ------------------------------------------------------------------ */

const SCHEMA_BY_RESOURCE = {
  collections: api.content.collectionCreate,
  apparel: api.content.apparelCreate,
  looks: api.content.lookCreate,
  docuseries: api.content.docuseriesCreate,
  'podcast-episodes': api.content.podcastCreate,
  'podcast-clips': api.content.clipCreate,
  artists: api.content.artistCreate,
  releases: api.content.releaseCreate,
  programmes: api.content.programmeCreate,
  events: api.content.eventCreate,
  announcements: api.site.announcementCreate,
  'hero-banners': api.site.heroCreate,
  pages: api.site.pageCreate,
};

/** Follows Zod's wrappers down to the object type that owns the shape. */
function unwrap(schema) {
  let current = schema;
  for (let depth = 0; depth < 12 && current?._def; depth += 1) {
    const { typeName } = current._def;
    if (typeName === 'ZodEffects') current = current._def.schema;
    else if (typeName === 'ZodOptional' || typeName === 'ZodNullable' || typeName === 'ZodDefault')
      current = current._def.innerType;
    else if (typeName === 'ZodArray') current = current._def.type;
    else break;
  }
  return current;
}

function checkNames(label, schema, formFields) {
  const shape = unwrap(schema)?._def?.shape?.();
  if (!shape) return;

  for (const field of formFields) {
    const child = shape[field.name];
    if (!child) {
      failures.push(`${label}: form field "${field.name}" is not a key the schema accepts`);
      continue;
    }
    if (field.fields) checkNames(`${label}.${field.name}`, child, field.fields);
  }
}

for (const resource of web.RESOURCES) {
  const schema = SCHEMA_BY_RESOURCE[resource.key];
  if (!schema) {
    failures.push(`no schema mapped for resource "${resource.key}" — add it to this script`);
    continue;
  }
  checkNames(resource.key, schema, resource.fields);
}

/* ------------------------------------------------------------------ */
/* 3. An untouched form invents no errors                              */
/* ------------------------------------------------------------------ */

for (const resource of web.RESOURCES) {
  const schema = SCHEMA_BY_RESOURCE[resource.key];
  if (!schema) continue;

  const payload = fields.toPayload(resource.fields, fields.blankValues(resource.fields));
  const result = schema.safeParse(payload);
  if (result.success) continue;

  const marked = new Set(resource.fields.filter((field) => field.required).map((field) => field.name));

  for (const issue of result.error.issues) {
    if (issue.path.length > 1) {
      // Nested: the operator has not opened that section, so this is a bug in
      // how the payload is prepared rather than something they can act on.
      failures.push(`${resource.key}: an empty form produces "${issue.path.join('.')}: ${issue.message}"`);
    } else if (!marked.has(issue.path[0])) {
      // Top level and genuinely required, but the form does not say so — the
      // operator finds out by having their save rejected.
      failures.push(`${resource.key}: "${issue.path[0]}" is required by the schema but not marked required`);
    }
  }

  for (const name of marked) {
    if (!result.error.issues.some((issue) => issue.path[0] === name)) {
      failures.push(`${resource.key}: "${name}" is marked required but the schema accepts it empty`);
    }
  }
}

/* ------------------------------------------------------------------ */

console.log(`${routes.size} API routes registered`);
console.log(`${web.RESOURCES.length} record types in the admin registry`);

if (failures.length === 0) {
  console.log('\n✓ Contract OK — routes exist, field names match, and an empty form is honest.');
} else {
  console.log(`\n✗ ${failures.length} problem(s):`);
  for (const failure of failures) console.log(`  · ${failure}`);
  process.exitCode = 1;
}
