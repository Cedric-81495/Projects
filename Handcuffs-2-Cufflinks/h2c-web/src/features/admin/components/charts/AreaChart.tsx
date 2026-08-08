import { useId, useMemo, useRef, useState } from 'react';

/**
 * Single-series area chart with a crosshair and tooltip.
 *
 * One series, so there is no legend: the card title already names what is
 * plotted, and a box with one swatch just restates it. One series is also why
 * this file needs no categorical palette — the platform has a single data hue,
 * and every chart here is built to need only that. Two hues drawn from a brand
 * of gold and emerald sit too close under protanopia to be honest about, so the
 * design avoids the situation rather than shipping a pair that fails.
 *
 * Drawn by hand rather than with a chart library. TailAdmin reaches for
 * ApexCharts; adding it would put ~140KB gzip on a platform whose guide names
 * fast and mobile-first as requirements, to draw four shapes. The approved
 * stack also does not include it, and swapping in a charting dependency is not
 * a decision to make inside a dashboard.
 */

export interface AreaPoint {
  /** ISO day, e.g. "2026-08-08". */
  day: string;
  value: number;
}

const PAD = { top: 14, right: 12, bottom: 26, left: 44 };
const VIEW = { w: 720, h: 240 };

export function AreaChart({
  points,
  label,
  formatValue = (value: number) => value.toLocaleString(),
}: {
  points: AreaPoint[];
  /** What one point means, shown in the tooltip. */
  label: string;
  formatValue?: (value: number) => string;
}) {
  const gradientId = useId();
  const holder = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const plot = useMemo(() => {
    const width = VIEW.w - PAD.left - PAD.right;
    const height = VIEW.h - PAD.top - PAD.bottom;
    const max = Math.max(1, ...points.map((point) => point.value));
    const ceiling = niceCeiling(max);

    const x = (index: number) =>
      PAD.left + (points.length <= 1 ? width / 2 : (index / (points.length - 1)) * width);
    const y = (value: number) => PAD.top + height - (value / ceiling) * height;

    const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${x(index)},${y(point.value)}`).join(' ');
    const area = points.length
      ? `${line} L${x(points.length - 1)},${PAD.top + height} L${x(0)},${PAD.top + height} Z`
      : '';

    return { width, height, ceiling, x, y, line, area, ticks: [0, ceiling / 2, ceiling] };
  }, [points]);

  if (points.length === 0) {
    return (
      <div className="adm-empty" style={{ padding: '48px 20px' }}>
        Nothing recorded in this window yet.
      </div>
    );
  }

  const active = hover === null ? null : points[hover];

  return (
    <div
      className="adm-chart"
      ref={holder}
      onPointerLeave={() => setHover(null)}
      onPointerMove={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        // Pointer x is mapped back through the viewBox rather than measured per
        // point, so the hit target is the full column width — a 2px line is far
        // too small to ask anyone to hit.
        const ratio = (event.clientX - box.left) / box.width;
        const inner = (ratio * VIEW.w - PAD.left) / (VIEW.w - PAD.left - PAD.right);
        const index = Math.round(inner * (points.length - 1));
        setHover(Math.min(points.length - 1, Math.max(0, index)));
      }}
    >
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img" aria-label={`${label} over time`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--data)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--data)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {plot.ticks.map((tick) => (
          <g key={tick}>
            <line
              className="adm-gridline"
              x1={PAD.left}
              x2={VIEW.w - PAD.right}
              y1={plot.y(tick)}
              y2={plot.y(tick)}
            />
            <text className="adm-axis" x={PAD.left - 10} y={plot.y(tick) + 3.5} textAnchor="end">
              {compact(tick)}
            </text>
          </g>
        ))}

        <path d={plot.area} fill={`url(#${gradientId})`} />
        <path
          d={plot.line}
          fill="none"
          stroke="var(--data)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* First, last, and middle only — a tick under every day is unreadable
            at 30 points and unnecessary at any count. */}
        {[0, Math.floor((points.length - 1) / 2), points.length - 1]
          .filter((index, position, all) => all.indexOf(index) === position)
          .map((index) => (
            <text
              key={index}
              className="adm-axis"
              x={plot.x(index)}
              y={VIEW.h - 8}
              textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
            >
              {shortDay(points[index].day)}
            </text>
          ))}

        {hover !== null && (
          <>
            <line
              x1={plot.x(hover)}
              x2={plot.x(hover)}
              y1={PAD.top}
              y2={PAD.top + plot.height}
              stroke="var(--line-strong)"
              strokeWidth="1"
            />
            {/* 2px surface ring so the marker stays legible over the line. */}
            <circle
              cx={plot.x(hover)}
              cy={plot.y(points[hover].value)}
              r="5"
              fill="var(--data)"
              stroke="var(--surface)"
              strokeWidth="2"
            />
          </>
        )}
      </svg>

      {active && (
        <div
          className="adm-tip"
          style={{ left: `${(plot.x(hover!) / VIEW.w) * 100}%`, top: `${(plot.y(active.value) / VIEW.h) * 100}%` }}
          role="status"
        >
          <div className="adm-tip-when">{longDay(active.day)}</div>
          <div className="adm-tip-row">
            <span className="adm-tip-key" aria-hidden="true" />
            {label}
            <b>{formatValue(active.value)}</b>
          </div>
        </div>
      )}
    </div>
  );
}

/** Rounds the axis top to something a person would have chosen. */
function niceCeiling(max: number): number {
  if (max <= 5) return 5;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  for (const step of [1, 1.5, 2, 2.5, 5, 10]) {
    const candidate = step * magnitude;
    if (candidate >= max) return candidate;
  }
  return 10 * magnitude;
}

function compact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  return String(Math.round(value));
}

function shortDay(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? day
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

function longDay(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? day
    : date.toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      });
}
