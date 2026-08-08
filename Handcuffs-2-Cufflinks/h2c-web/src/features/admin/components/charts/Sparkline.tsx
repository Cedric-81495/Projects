/**
 * Twelve-point trend for a stat tile.
 *
 * Deliberately axis-free and unlabelled: a sparkline's job is shape, not value.
 * The number above it carries the value, and the full chart carries the detail.
 */
export function Sparkline({ values, ariaLabel }: { values: number[]; ariaLabel: string }) {
  if (values.length < 2) return null;

  const width = 96;
  const height = 30;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;

  const x = (index: number) => (index / (values.length - 1)) * width;
  const y = (value: number) => height - 2 - ((value - min) / span) * (height - 6);

  const line = values.map((value, index) => `${index === 0 ? 'M' : 'L'}${x(index)},${y(value)}`).join(' ');
  const last = values.length - 1;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label={ariaLabel}
      style={{ overflow: 'visible', flex: '0 0 auto' }}
    >
      <path d={`${line} L${width},${height} L0,${height} Z`} fill="var(--data-wash)" />
      <path d={line} fill="none" stroke="var(--data)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      {/* The current period gets the accent dot; the rest of the line is the trend. */}
      <circle cx={x(last)} cy={y(values[last])} r="2.75" fill="var(--data)" stroke="var(--surface)" strokeWidth="2" />
    </svg>
  );
}
