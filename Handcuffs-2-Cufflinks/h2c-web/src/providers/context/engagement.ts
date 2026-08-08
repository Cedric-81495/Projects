import { createContext, useContext } from 'react';
import type { SeedApparel } from '@/data/apparel';

export type EngagementKind = 'like' | 'save' | 'vote' | 'notify';

export interface EngagementContextValue {
  isOn: (kind: EngagementKind, id: string) => boolean;
  toggle: (kind: EngagementKind, id: string) => void;
  count: (kind: 'like' | 'vote', id: string) => number;
  /**
   * Resolves an apparel id to the live record.
   *
   * Saved ids come back from the API and belong to whatever is published now,
   * so anything that needs a name for one — the saved drawer, the account page
   * — has to look it up against the same catalogue the provider fetched, not
   * against a constant compiled into the bundle.
   */
  itemById: (id: string) => SeedApparel | undefined;
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
