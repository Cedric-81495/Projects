import { Glyph } from './Glyph';
import type { GlyphName } from './Glyph';
import { Sparkline } from './charts/Sparkline';
import { Skeleton } from './Chrome';

/**
 * Stat tile.
 *
 * Contract from the design system: label, value, optional delta against a
 * *named* period, optional 12-point trend. The value uses the interface sans
 * and proportional figures — tabular figures give every digit the width of a
 * zero, which makes a number like 121 look loose at this size. Tabular is for
 * columns that have to align, which is the table, not here.
 *
 * The delta's colour is direction × whether up is good, not direction alone.
 * Unsubscribes rising is not a green event.
 */

export interface Delta {
  /** Signed change, already computed. */
  value: number;
  /** What it is measured against — "vs previous 30 days". */
  since: string;
  /** Set false where a rise is bad (unsubscribes, pending queue). */
  upIsGood?: boolean;
  /** Render as a percentage rather than a count. */
  percent?: boolean;
}

export function MetricCard({
  label,
  value,
  glyph,
  accent,
  delta,
  trend,
  note,
  loading,
}: {
  label: string;
  value: string;
  glyph: GlyphName;
  /** The one tile the screen leads with wears the accent badge. */
  accent?: boolean;
  delta?: Delta;
  trend?: number[];
  note?: string;
  loading?: boolean;
}) {
  return (
    <article className="adm-card">
      <div className="adm-metric">
        <div className="adm-metric-top">
          <span className={accent ? 'adm-metric-icon adm-metric-icon--accent' : 'adm-metric-icon'}>
            <Glyph name={glyph} />
          </span>
          {trend && trend.length > 1 && !loading && (
            <Sparkline values={trend} ariaLabel={`${label} trend`} />
          )}
        </div>

        <div style={{ display: 'grid', gap: 5 }}>
          <span className="adm-metric-label">{label}</span>
          {loading ? <Skeleton height={30} width="58%" /> : <span className="adm-metric-value">{value}</span>}
        </div>

        {(delta || note) && !loading && (
          <div className="adm-metric-foot">
            {delta && <DeltaChip {...delta} />}
            {note && <span className="adm-metric-note">{note}</span>}
          </div>
        )}
      </div>
    </article>
  );
}

function DeltaChip({ value, since, upIsGood = true, percent }: Delta) {
  const flat = value === 0;
  const good = value > 0 === upIsGood;
  const tone = flat ? 'flat' : good ? 'up' : 'down';
  const text = `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toLocaleString()}${percent ? '%' : ''}`;

  return (
    <>
      <span className={`adm-delta adm-delta--${tone}`}>
        {!flat && <Glyph name={value > 0 ? 'arrow-up' : 'arrow-down'} />}
        {flat ? 'No change' : text}
      </span>
      <span className="adm-metric-note">{since}</span>
    </>
  );
}
