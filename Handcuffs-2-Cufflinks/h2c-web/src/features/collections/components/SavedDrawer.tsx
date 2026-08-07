import { useEffect, useRef } from 'react';
import { useEngagement } from '@/providers/context/engagement';
import { useScrollLock } from '@/hooks/useScrollLock';
import { apparelById } from '@/data/apparel';
import { AssetSlot } from '@/components/ui/AssetSlot';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ROUTES } from '@/router/routes';
import { cn } from '@/lib/utils/cn';

/**
 * The saved rail. This is the closest thing to a basket the site has, and it
 * intentionally goes nowhere near checkout: the footer action is to join the
 * movement, because that is the conversion being measured.
 */
export function SavedDrawer() {
  const { isDrawerOpen, closeDrawer, savedIds, clearSaved, toggle } = useEngagement();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useScrollLock(isDrawerOpen);

  // Escape closes, and focus moves into the panel so keyboard users are not
  // left behind the scrim.
  useEffect(() => {
    if (!isDrawerOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isDrawerOpen, closeDrawer]);

  const items = savedIds.map(apparelById).filter((x): x is NonNullable<typeof x> => Boolean(x));

  return (
    <>
      <div
        className={cn('scrim', isDrawerOpen && 'is-on')}
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <div
        className={cn('drawer', isDrawerOpen && 'is-on')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawerTitle"
        ref={panelRef}
      >
        <div className="drawer-hd">
          <h2 id="drawerTitle">Saved pieces</h2>
          <button
            type="button"
            className="iconbtn"
            onClick={closeDrawer}
            ref={closeRef}
            aria-label="Close saved pieces"
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="drawer-bd">
          {items.length === 0 ? (
            <div className="empty">
              <h3 className="h-sm">Nothing saved yet</h3>
              <p>
                Save the pieces that say something to you. What the movement saves and votes for
                decides what gets made next.
              </p>
              <ButtonLink to={ROUTES.collections} variant="ghost" size="sm" onClick={closeDrawer}>
                Browse the collections
              </ButtonLink>
            </div>
          ) : (
            items.map((item) => (
              <div className="saved" key={item.id}>
                <AssetSlot ratio="3x4" tone={item.tone} label="IMG" />
                <div>
                  <b>{item.name}</b>
                  <span>{item.badge}</span>
                </div>
                <button
                  type="button"
                  className="iconbtn"
                  onClick={() => toggle('save', item.id)}
                  aria-label={`Remove ${item.name} from saved`}
                >
                  <Icon name="close" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="drawer-ft">
          <ButtonLink to={ROUTES.join} variant="gold" wide icon="arrow" onClick={closeDrawer}>
            Join the Movement
          </ButtonLink>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" wide onClick={clearSaved}>
              Clear saved
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
