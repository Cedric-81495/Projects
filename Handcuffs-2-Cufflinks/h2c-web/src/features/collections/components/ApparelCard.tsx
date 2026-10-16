import { AssetSlot } from '@/components/ui/AssetSlot';
import { EngagementControls } from './EngagementControls';
import type { SeedApparel } from '@/data/apparel';

/**
 * Apparel card. Deliberately carries the piece's meaning rather than a price:
 * the guide asks the collections to inspire rather than to pressure.
 */
export function ApparelCard({
  item,
  compact = false,
}: {
  item: SeedApparel;
  compact?: boolean;
}) {
  const ratio = item.asset.includes('1x1') ? '1x1' : '3x4';

  return (
    <article className="pcard">
      <div className="pcard-fig">
        <span className="pcard-badge">{item.badge}</span>
        <AssetSlot ratio={ratio} tone={item.tone} label="PHOTO" spec={item.asset} />
        {item.assetAlt && (
          /*
           * The second angle, stacked over the first and revealed on hover.
           *
           * Both are rendered rather than swapping the src, so the change is a
           * cross-fade with no flash of empty space while the second loads.
           * Hidden from assistive technology: it is the same garment, and a
           * screen reader announcing two photographs of one piece is noise.
           * Pointer-device only, since a phone has no hover and the strip
           * would simply never appear.
           *
           * `fallback="none"` matters here: if the second photograph has not
           * been delivered, this renders nothing and the card simply does not
           * react. The default would put a grey placeholder over a real
           * photograph on hover, which reads as the image breaking.
           */
          <div className="pcard-alt" aria-hidden="true">
            <AssetSlot
              ratio={ratio}
              tone={item.tone}
              label="PHOTO"
              spec={item.assetAlt}
              fallback="none"
            />
          </div>
        )}
      </div>
      <div className="pcard-body">
        <h3 className="pcard-title">{item.name}</h3>
        <p className="pcard-meaning">{item.meaning}</p>
        <EngagementControls item={item} compact={compact} />
      </div>
    </article>
  );
}
