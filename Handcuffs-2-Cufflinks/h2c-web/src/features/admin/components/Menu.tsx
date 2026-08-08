import { useEffect, useId, useRef, useState } from 'react';

/**
 * A dropdown that closes the three ways people expect: outside click, Escape,
 * and picking something.
 *
 * The trigger is passed a render prop rather than composed with children so the
 * caller keeps control of its markup — the user menu is an avatar row, the
 * row-actions menu is an icon button, and forcing both through one wrapper
 * would mean styling around it.
 */
export function Menu({
  trigger,
  children,
  label,
}: {
  trigger: (props: { open: boolean; toggle: () => void; id: string }) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const holder = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;

    const onPointer = (event: PointerEvent) => {
      if (!holder.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    // Pointerdown rather than click: a click listener fires after the element
    // under the pointer may already have been removed by another handler, which
    // makes the contains() check unreliable.
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={holder} style={{ position: 'relative' }}>
      {trigger({ open, toggle: () => setOpen((current) => !current), id })}
      {open && (
        <div className="adm-menu" role="menu" aria-label={label} id={id}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
