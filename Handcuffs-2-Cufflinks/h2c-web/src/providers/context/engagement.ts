import { createContext, useContext } from 'react';

export type EngagementKind = 'like' | 'save' | 'vote' | 'notify';

export interface EngagementContextValue {
  isOn: (kind: EngagementKind, id: string) => boolean;
  toggle: (kind: EngagementKind, id: string) => void;
  count: (kind: 'like' | 'vote', id: string) => number;
  savedIds: string[];
  savedCount: number;
  clearSaved: () => void;
  voteTotals: { slug: string; name: string; value: number; percent: number }[];
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

export const EngagementContext = createContext<EngagementContextValue | null>(null);

export function useEngagement(): EngagementContextValue {
  const ctx = useContext(EngagementContext);
  if (!ctx) throw new Error('useEngagement must be used within EngagementProvider');
  return ctx;
}
