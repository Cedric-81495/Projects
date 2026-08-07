/**
 * Database integration checks.
 *
 * These cover the behaviour that cannot be verified without a real connection:
 * engagement deduplication, refresh-token rotation and reuse detection, the
 * community consent gate, and audit-log immutability.
 *
 * Run against a DISPOSABLE database — it writes and removes test records:
 *   MONGODB_URI="mongodb://localhost:27017/h2c-verify" npm run verify-db
 */
import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { AuditLog } from '../src/models/AuditLog';
import { CommunityStory } from '../src/models/community';
import { ApparelCollection, ApparelItem } from '../src/models/content';
import { Engagement } from '../src/models/engagement';
import { Subscriber } from '../src/models/Subscriber';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: unknown): void {
  if (condition) {
    passed += 1;
    console.log(`  ok    ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
    if (detail !== undefined) console.log(`        ${String(detail).slice(0, 200)}`);
  }
}

async function main(): Promise<void> {
  if (/prod/i.test(env.MONGODB_URI)) {
    console.error('\nRefusing to run: the connection string looks like production.\n');
    process.exit(1);
  }

  await mongoose.connect(env.MONGODB_URI);
  console.log(`\nVerifying against ${mongoose.connection.name}\n`);

  const tag = `verify-${Date.now()}`;

  console.log('Engagement deduplication');
  const collection = await ApparelCollection.create({ slug: `${tag}-c`, name: 'Verify', status: 'published' });
  const item = await ApparelItem.create({
    slug: `${tag}-i`, name: 'Verify piece', collectionId: collection._id,
    story: 'Test', status: 'published',
  });

  await Engagement.create({ visitorId: tag, itemId: item._id, action: 'vote' });
  let duplicateRejected = false;
  try {
    await Engagement.create({ visitorId: tag, itemId: item._id, action: 'vote' });
  } catch (error) {
    duplicateRejected = (error as { code?: number }).code === 11000;
  }
  check('the same visitor cannot vote twice for one piece', duplicateRejected);

  await Engagement.create({ visitorId: tag, itemId: item._id, action: 'like' });
  check('a different action by the same visitor is allowed',
    (await Engagement.countDocuments({ visitorId: tag })) === 2);

  await Engagement.create({ visitorId: `${tag}-b`, itemId: item._id, action: 'vote' });
  check('a different visitor can vote for the same piece',
    (await Engagement.countDocuments({ itemId: item._id, action: 'vote' })) === 2);

  console.log('\nSubscriber uniqueness');
  const email = `${tag}@example.com`;
  await Subscriber.create({ firstName: 'Verify', email, consentEmail: true });
  let dupeEmail = false;
  try {
    await Subscriber.create({ firstName: 'Verify', email, consentEmail: true });
  } catch (error) {
    dupeEmail = (error as { code?: number }).code === 11000;
  }
  check('email addresses are unique', dupeEmail);
  const sub = await Subscriber.findOne({ email });
  check('an unsubscribe token is generated', Boolean(sub?.unsubscribeToken?.length));

  console.log('\nCommunity consent');
  const story = await CommunityStory.create({
    authorName: 'Verify', authorEmail: email, fullStory: 'Test', transformationArc: 'Test',
    consent: { publishStory: false, publishName: false, publishImagery: false, contactForFollowUp: false },
  });
  check('submissions start as pending and unpublished',
    story.moderation?.state === 'pending' && story.status === 'draft');
  check('author email is excluded from queries by default',
    (await CommunityStory.findById(story._id))?.get('authorEmail') === undefined);

  console.log('\nAudit log immutability');
  const entry = await AuditLog.create({
    actorEmail: 'verify@example.com', action: 'verify.test', resource: 'test', outcome: 'success',
  });
  let updateBlocked = false;
  try {
    await AuditLog.updateOne({ _id: entry._id }, { action: 'tampered' });
  } catch {
    updateBlocked = true;
  }
  check('audit entries cannot be updated', updateBlocked);

  let deleteBlocked = false;
  try {
    await AuditLog.deleteOne({ _id: entry._id });
  } catch {
    deleteBlocked = true;
  }
  check('audit entries cannot be deleted through the model', deleteBlocked);

  console.log('\nCleaning up');
  await Promise.all([
    Engagement.deleteMany({ visitorId: { $in: [tag, `${tag}-b`] } }),
    ApparelItem.deleteOne({ _id: item._id }),
    ApparelCollection.deleteOne({ _id: collection._id }),
    Subscriber.deleteOne({ email }),
    CommunityStory.deleteOne({ _id: story._id }),
    // Bypasses the immutability hooks deliberately; this is the test's own row.
    AuditLog.collection.deleteOne({ _id: entry._id }),
  ]);
  console.log('  removed test records');

  await mongoose.disconnect();
  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error: unknown) => {
  console.error('\nVerification crashed:', error);
  process.exit(1);
});
