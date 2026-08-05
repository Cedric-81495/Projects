import { useState } from 'react';
import type { LookbookEntry } from '@/types';
import { SmartImage } from '@/shared/media';

/**
 * The lookbook is brand expression, not commerce: each look is a
 * chapter of the arc. No prices, no cart — pieces are described by
 * name and material only ("wear your story").
 */
export function Lookbook({ entries }: { entries: LookbookEntry[] }) {
  const [active, setActive] = useState(0);
  const look = entries[Math.min(active, entries.length - 1)];
  if (!look) return null;

  return (
    <>
      <div className="rail" role="tablist" aria-label="Lookbook chapters">
        {entries.map((l, i) => (
          <button
            key={l.id}
            role="tab"
            aria-selected={i === active}
            className="chip"
            onClick={() => setActive(i)}
            style={{ ['--ch' as string]: l.ch }}
          >
            <span className="chip-bar" />
            <SmartImage src={l.media.src ?? l.media.poster} alt={l.name} ratio="2x3" warm={false} />
            <span className="chip-txt">
              <span className="chip-num">{l.n}</span>
              <span className="chip-name">{l.name}</span>
              <span className="chip-reg">{l.reg}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="look">
        <SmartImage src={look.media.src ?? look.media.poster} alt={`${look.name} — full look`} ratio="2x3" />
        <div>
          <span className="chip-num" style={{ fontSize: '1.6rem' }}>{look.n}</span>
          <h3 className="h3" style={{ marginTop: 8 }}>{look.name}</h3>
          <p className="chip-reg" style={{ marginBottom: 18 }}>{look.reg}</p>
          <p className="body">{look.theme}</p>
          {look.pieces.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>
              {look.pieces.map((piece) => (
                <li key={piece.t} className="piece">
                  <span className="piece-dot" aria-hidden="true" />
                  <span>
                    <span className="piece-name">{piece.t}</span>
                    <span className="piece-var">{piece.v}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
