import { useEngagement } from '@/providers/context/engagement';

/**
 * What the movement is actually asking for.
 *
 * This is the readout that decides which collection gets produced next, so it
 * is shown to visitors rather than hidden in the admin panel — voting is more
 * compelling when you can see it land.
 */
export function VoteMeter() {
  const { voteTotals } = useEngagement();

  return (
    <div className="meter">
      {voteTotals.map((row) => (
        <div className="meter-row" key={row.slug}>
          <span className="meter-name">{row.name}</span>
          <span className="meter-val">{row.value.toLocaleString('en-US')} votes</span>
          <div
            className="meter-track"
            role="meter"
            aria-valuenow={row.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${row.name}: ${row.percent}% of the leading collection`}
          >
            <div
              className="meter-fill is-in"
              style={{ transform: `scaleX(${row.percent / 100})` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
