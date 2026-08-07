import { useState } from 'react';
import { Section, Wrap } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { AssetSlot } from '@/components/ui/AssetSlot';
import { ArrowLink } from '@/components/ui/Button';
import { LOOKS } from '@/data/looks';
import { ROUTES } from '@/router/routes';
import { cn } from '@/lib/utils/cn';

/**
 * Homepage section 5 — the eight photoshoot looks.
 *
 * The numbering is not decoration: look 01 is where the story starts and look
 * 08 is where it arrives, so the sequence carries the arc. The rail is a
 * tablist because moving between looks should not reload anything.
 */
export function PhotoshootLooks() {
  const [active, setActive] = useState(0);
  const look = LOOKS[active];

  return (
    <Section surface="forest">
      <Wrap>
        <Eyebrow>The photoshoot · eight looks, one arc</Eyebrow>
        <h2 className="h-lg rise d1">
          Eight looks.
          <br />
          One journey.
        </h2>
        <p className="body rise d2">
          The shoot is not a catalogue — it is a sequence. Look 01 is where it started. Look 08 is
          where it went. Open any look to see the individual pieces inside it.
        </p>

        <div className="rail rise d3" role="tablist" aria-label="Photoshoot looks">
          {LOOKS.map((entry, i) => (
            <button
              key={entry.n}
              type="button"
              role="tab"
              id={`look-tab-${entry.n}`}
              aria-selected={i === active}
              aria-controls={`look-panel-${entry.n}`}
              className={cn('rail-btn', i === active && 'is-on')}
              onClick={() => setActive(i)}
            >
              <small>{entry.n}</small>
              <span>{entry.title}</span>
            </button>
          ))}
        </div>

        <div
          className="look"
          role="tabpanel"
          id={`look-panel-${look.n}`}
          aria-labelledby={`look-tab-${look.n}`}
        >
          <AssetSlot
            ratio="3x4"
            tone={active % 3 === 2 ? 'em' : active % 3 === 1 ? 'warm' : ''}
            label="PHOTO"
            spec={`H2C_Looks_Look${look.n}_Full_3x4.jpg`}
          />

          <div>
            <p className="micro">Look {look.n}</p>
            <h3 className="h-md" style={{ marginTop: '10px' }}>
              {look.title}
            </h3>
            <p className="body">{look.note}</p>

            <p className="h-xs" style={{ marginTop: '1.6em' }}>
              In this look
            </p>
            <div className="look-pieces">
              {look.pieces.map((piece) => (
                <div className="piece" key={piece}>
                  <AssetSlot ratio="1x1" label="IMG" />
                  <b>{piece}</b>
                  <span>Showcase only</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 'clamp(22px,2.6vw,34px)' }}>
              <ArrowLink to={ROUTES.looks}>See all eight looks</ArrowLink>
            </div>
          </div>
        </div>
      </Wrap>
    </Section>
  );
}
