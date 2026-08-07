import { RecordModulePage } from './RecordModulePage';

/**
 * The four record modules from the CMS specification. Keeping their definitions
 * together makes it obvious which brand owns which records.
 */

export function AdminH2CPage() {
  return (
    <RecordModulePage
      eyebrow="Handcuffs 2 Cufflinks"
      title="Movement content"
      intro="Everything on the public site: the homepage, the collections, the media, and the subscriber list."
      groups={[
        {
          name: 'Website',
          records: [
            'Homepage sections and hero',
            'Static pages',
            'Navigation',
            'SEO metadata',
            'Announcements',
          ],
        },
        {
          name: 'Apparel',
          records: [
            'Collections',
            'Apparel items and stories',
            'Photoshoot looks',
            'Engagement metrics',
          ],
        },
        {
          name: 'Media and stories',
          records: ['Docuseries episodes', 'Podcast episodes and clips', 'Community stories', 'Founder content'],
        },
        {
          name: 'Audience',
          records: ['Join the Movement subscribers', 'Newsletter campaigns', 'Events'],
        },
      ]}
    />
  );
}

export function AdminKitchenPage() {
  return (
    <RecordModulePage
      eyebrow="Kitchen Muzik Management"
      title="Label records"
      intro="The label's own catalogue, roster, and release schedule, kept separate from the parent brand's content."
      groups={[
        { name: 'Artists', records: ['Profiles and biographies', 'Images', 'Social links', 'Active status'] },
        {
          name: 'Catalogue',
          records: ['Singles', 'Albums', 'Mixtapes', 'Music videos', 'Cover artwork', 'Streaming links'],
        },
        {
          name: 'Production',
          records: ['Producers', 'Songwriters', 'Collaborators', 'Studios', 'Copyright information'],
        },
        { name: 'Releases', records: ['Scheduled', 'Published', 'Release history', 'Play and view analytics'] },
      ]}
    />
  );
}

export function AdminGwopPage() {
  return (
    <RecordModulePage
      eyebrow="GWOP"
      title="Programme records"
      intro="Education, mentorship, and community development records, including participants and impact reporting."
      groups={[
        {
          name: 'Programmes',
          records: ['Courses', 'Workshops', 'Seminars', 'Training materials', 'Learning resources'],
        },
        {
          name: 'Community',
          records: ['Mentorship pairings', 'Outreach', 'Volunteer opportunities', 'Youth initiatives'],
        },
        {
          name: 'Members',
          records: ['Participant profiles', 'Registrations', 'Attendance', 'Completion status'],
        },
        { name: 'Events and impact', records: ['Schedules and venues', 'Speakers', 'Registrations', 'Impact reports'] },
      ]}
    />
  );
}

export function AdminCommunityPage() {
  return (
    <RecordModulePage
      eyebrow="Community"
      title="Submissions and moderation"
      intro="Everything the movement sends in. Nothing is published until a moderator approves it and consent is on record."
      groups={[
        { name: 'Submissions', records: ['Stories', 'Videos', 'Before-and-after entries', 'Apparel photos'] },
        { name: 'Moderation', records: ['Pending review', 'Approved', 'Needs changes', 'Rejected'] },
        { name: 'Consent', records: ['Story permission', 'Name permission', 'Image and video permission'] },
        { name: 'Registrations', records: ['Events', 'Volunteers', 'Mentorship applications'] },
      ]}
    />
  );
}

export function AdminMediaPage() {
  return (
    <RecordModulePage
      eyebrow="Digital assets"
      title="Media library"
      intro="One library, organised by brand so assets stay on-brand and easy to find."
      groups={[
        { name: 'Handcuffs 2 Cufflinks', records: ['Photography', 'Video', 'Brand assets', 'Marketing materials'] },
        { name: 'GWOP', records: ['Programme imagery', 'Documents', 'Forms and templates'] },
        { name: 'Kitchen Muzik Management', records: ['Cover artwork', 'Audio', 'Music video', 'Press kits'] },
        { name: 'Controls', records: ['Upload restrictions', 'File renaming', 'Alt text', 'Usage tracking'] },
      ]}
    />
  );
}

export function AdminSubscribersPage() {
  return (
    <RecordModulePage
      eyebrow="Audience"
      title="Join the Movement subscribers"
      intro="The North Star metric. Growth here is how the platform's success is measured."
      groups={[
        { name: 'List', records: ['Subscribers', 'Channel consent', 'Interests', 'Source page'] },
        { name: 'Campaigns', records: ['Drafts', 'Scheduled', 'Sent', 'Open and click rates'] },
        { name: 'Compliance', records: ['Consent records', 'Unsubscribes', 'Export requests', 'Deletion requests'] },
      ]}
    />
  );
}

export function AdminUsersPage() {
  return (
    <RecordModulePage
      eyebrow="Access"
      title="Users and roles"
      intro="Super Administrators and Admins. Role changes and sign-in activity are recorded in the audit log."
      groups={[
        { name: 'Users', records: ['Accounts', 'Roles', 'Email verification', 'Multi-factor authentication'] },
        { name: 'Audit log', records: ['Sign-in attempts', 'Publishing activity', 'Deletions', 'Role changes'] },
      ]}
    />
  );
}
