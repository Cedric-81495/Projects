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
      </div>
      <div className="pcard-body">
        <h3 className="pcard-title">{item.name}</h3>
        <p className="pcard-meaning">{item.meaning}</p>
        <EngagementControls item={item} compact={compact} />
      </div>
    </article>
  );
}
