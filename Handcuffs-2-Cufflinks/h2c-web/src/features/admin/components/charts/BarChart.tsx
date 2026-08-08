import { useState } from 'react';

/**
 * Horizontal bars for one measure across nominal categories.
 *
 * Every bar wears the same hue on purpose. Colouring nominal bars by their
 * value spends the identity channel re-encoding what bar length already shows,
 * and it invents a categorical palette this platform does not need. Length is
 * the encoding; colour is just the brand.
 *
 * Horizontal rather than vertical because the categories are words — "Notify
 * me", "Favourites" — and vertical columns would either rotate the labels or
 * truncate them.
 */

export interface BarRow {
  label: string;
  value: number;
  /** Optional second line under the label. */
  note?: string;
}

export function BarChart({
  rows,
  valueLabel,
  emptyMessage = 'Nothing recorded yet.',
}: {
  rows: BarRow[];
  /** Named in the tooltip, e.g. "likes". */
  valueLabel: string;
  emptyMessage?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(1, ...rows.map((row) => row.value));

  if (rows.length === 0) return <div className="adm-empty">{emptyMessage}</div>;

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {rows.map((row) => {
        const share = (row.value / max) * 100;
        return (
          <div
            key={row.label}
            style={{ display: 'grid', gap: 6 }}
            onPointerEnter={() => setHover(row.label)}
            onPointerLeave={() => setHover(null)}
          >
            <div className="adm-meter-top">
              <span className="adm-meter-name">
                {row.label}
                {row.note && <span className="adm-meter-note"> · {row.note}</span>}
              </span>
              {/* Direct label on every bar is fine here: there are five of them
                  and the value is the whole point of the panel. */}
              <span className="adm-meter-val">{row.value.toLocaleString()}</span>
            </div>
            <div
              className="adm-meter-track"
              role="img"
              aria-label={`${row.label}: ${row.value.toLocaleString()} ${valueLabel}`}
              title={hover === row.label ? `${row.value.toLocaleString()} ${valueLabel}` : undefined}
            >
              <div
                className="adm-meter-fill"
                style={{
                  width: `${Math.max(share, row.value > 0 ? 2 : 0)}%`,
                  opacity: hover && hover !== row.label ? 0.55 : 1,
                  transition: 'width .4s cubic-bezier(.22,.68,.16,1), opacity .16s',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
