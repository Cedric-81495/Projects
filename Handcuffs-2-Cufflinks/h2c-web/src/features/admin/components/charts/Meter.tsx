/**
 * A part of a whole, one hue.
 *
 * Used for reach against total, which is the question "was that a hundred plays
 * from four people, or from ninety?" — a proportion, not two series. Modelling
 * it as a fill on a track of the same hue says that directly, and avoids
 * inventing a second categorical colour to compare a number against a number it
 * is contained by.
 */
export function Meter({
  name,
  value,
  of,
  valueLabel,
  ofLabel,
}: {
  name: string;
  value: number;
  of: number;
  valueLabel: string;
  ofLabel: string;
}) {
  const share = of > 0 ? Math.min(100, (value / of) * 100) : 0;

  return (
    <div className="adm-meter">
      <div className="adm-meter-top">
        <span className="adm-meter-name">{name}</span>
        <span className="adm-meter-val">
          {value.toLocaleString()}
          <span className="adm-meter-note"> / {of.toLocaleString()}</span>
        </span>
      </div>
      <div
        className="adm-meter-track"
        role="img"
        aria-label={`${name}: ${value.toLocaleString()} ${valueLabel} of ${of.toLocaleString()} ${ofLabel}`}
      >
        <div
          className="adm-meter-fill"
          style={{ width: `${Math.max(share, value > 0 ? 2 : 0)}%`, transition: 'width .4s cubic-bezier(.22,.68,.16,1)' }}
        />
      </div>
      <span className="adm-meter-note">
        {of > 0
          ? `${Math.round(share)}% — ${valueLabel} against ${ofLabel}`
          : `No ${ofLabel} recorded in this window`}
      </span>
    </div>
  );
}
