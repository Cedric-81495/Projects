import { useEngagement } from '@/providers/context/engagement';
import { useToast } from '@/providers/context/toast';
import { Icon } from '@/components/ui/Icon';
import { compactCount } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { SeedApparel } from '@/data/apparel';

/**
 * The engagement row on every apparel card.
 *
 * These four controls are the only interaction apparel has in showcase mode.
 * There is no add-to-cart and no price, by requirement — the point is to
 * measure interest, not to sell.
 */
export function EngagementControls({
  item,
  compact = false,
}: {
  item: SeedApparel;
  compact?: boolean;
}) {
  const { isOn, toggle, count } = useEngagement();
  const { notify } = useToast();

  const liked = isOn('like', item.id);
  const saved = isOn('save', item.id);
  const voted = isOn('vote', item.id);

  async function share(): Promise<void> {
    const url = `${window.location.origin}/collections/item/${item.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.name, text: item.meaning, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      notify('Link copied');
    } catch {
      // The visitor dismissed the share sheet. Nothing to report.
    }
  }

  return (
    <div className="pcard-tools">
      <button
        type="button"
        className={cn('eng', liked && 'is-on')}
        onClick={() => toggle('like', item.id)}
        aria-pressed={liked}
        aria-label={liked ? `Remove your like from ${item.name}` : `Like ${item.name}`}
      >
        <Icon name="like" />
        <span className="eng-count">{compactCount(count('like', item.id))}</span>
      </button>

      <button
        type="button"
        className={cn('eng', saved && 'is-on')}
        onClick={() => toggle('save', item.id)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${item.name} from saved` : `Save ${item.name}`}
      >
        <Icon name="save" />
        {!compact && <span>{saved ? 'Saved' : 'Save'}</span>}
      </button>

      <button
        type="button"
        className={cn('eng', voted && 'is-on')}
        onClick={() => toggle('vote', item.id)}
        aria-pressed={voted}
        aria-label={voted ? `Withdraw your vote for ${item.name}` : `Vote to release ${item.name}`}
      >
        <Icon name="vote" />
        <span className="eng-count">{compactCount(count('vote', item.id))}</span>
      </button>

      {!compact && (
        <>
          <button
            type="button"
            className={cn('eng', isOn('notify', item.id) && 'is-on')}
            onClick={() => toggle('notify', item.id)}
            aria-pressed={isOn('notify', item.id)}
            aria-label={`Notify me when ${item.name} is released`}
          >
            <Icon name="notify" />
            <span>Notify me</span>
          </button>

          <button
            type="button"
            className="eng"
            onClick={() => void share()}
            aria-label={`Share ${item.name}`}
          >
            <Icon name="share" />
          </button>
        </>
      )}
    </div>
  );
}
