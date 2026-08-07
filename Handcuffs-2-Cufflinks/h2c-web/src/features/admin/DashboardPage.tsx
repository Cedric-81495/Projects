import { Seo } from '@/lib/seo/Seo';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Note } from '@/components/ui/Note';
import { VoteMeter } from '@/features/collections/components/VoteMeter';
import { APPAREL } from '@/data/apparel';
import { compactCount } from '@/lib/utils/format';

/**
 * Reporting dashboard.
 *
 * Success on this platform is community growth, not sales, so the headline
 * figures are subscribers and engagement. The apparel vote readout sits here
 * because it is the decision this dashboard exists to support: what to make
 * next.
 */
export function DashboardPage() {
  const totalLikes = APPAREL.reduce((sum, a) => sum + a.likes, 0);
  const totalVotes = APPAREL.reduce((sum, a) => sum + a.votes, 0);

  const stats = [
    { label: 'Movement subscribers', value: '—' },
    { label: 'Apparel likes', value: compactCount(totalLikes) },
    { label: 'Release votes', value: compactCount(totalVotes) },
    { label: 'Stories awaiting review', value: '—' },
  ];

  return (
    <>
      <Seo title="Dashboard" description="Engagement across the ecosystem." noIndex />
      <Eyebrow reveal={false}>Reporting</Eyebrow>
      <h1 className="h-md">Across the ecosystem</h1>

      <div className="stats">
        {stats.map((stat) => (
          <div className="stat" key={stat.label}>
            <b>{stat.value}</b>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'clamp(30px,3.4vw,48px)', maxWidth: 760 }}>
        <Note label="Live data pending">
          Figures marked with a dash come from the analytics and subscriber endpoints, which are not
          deployed yet. Apparel engagement below reflects the seeded reference data.
        </Note>

        <h2 className="h-sm" style={{ marginTop: 'clamp(28px,3vw,42px)' }}>
          What the movement is asking for
        </h2>
        <VoteMeter />
      </div>
    </>
  );
}
