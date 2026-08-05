import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type Overlay = 'search' | 'menu' | null;

interface UIContextValue {
  overlay: Overlay;
  openOverlay: (o: Exclude<Overlay, null>) => void;
  closeOverlay: () => void;
  toggleOverlay: (o: Exclude<Overlay, null>) => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const value = useMemo<UIContextValue>(
    () => ({
      overlay,
      openOverlay: (o) => setOverlay(o),
      closeOverlay: () => setOverlay(null),
      toggleOverlay: (o) => setOverlay((cur) => (cur === o ? null : o)),
      toast,
      showToast,
    }),
    [overlay, toast, showToast]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
