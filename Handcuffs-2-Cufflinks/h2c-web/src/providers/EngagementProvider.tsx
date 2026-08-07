import { useCallback, useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from './context/toast';
import { EngagementContext } from './context/engagement';
import type { EngagementContextValue, EngagementKind } from './context/engagement';
import { APPAREL, apparelById } from '@/data/apparel';
import { COLLECTIONS } from '@/data/collections';
import { apiPost } from '@/lib/api/client';
import { API } from '@/lib/api/endpoints';

/**
 * Apparel engagement — the entire interaction model in showcase mode.
 *
 * Likes, saves, votes, and notify-me replace the cart. These signals are what
 * the CMS reports on to decide which pieces actually get produced, so each one
 * is written through to the analytics endpoint as well as held locally.
 *
 * Local state is optimistic and persisted: a visitor's saved rail survives a
 * reload before they ever create an account. The write is fire-and-forget
 * because a failed count must never block the interaction — the visitor's
 * intent is recorded locally either way, and the server reconciles totals.
 */

interface EngagementState {
  likes: string[];
  saves: string[];
  votes: string[];
  notifies: string[];
}

const EMPTY: EngagementState = { likes: [], saves: [], votes: [], notifies: [] };

/**
 * Action -> state field. Written out rather than derived by appending "s",
 * because "notify" pluralises to "notifies" and the derived version silently
 * produced `notifys`, reading an undefined array and crashing the Collections
 * page. Typing it as Record<EngagementKind, keyof EngagementState> means a
 * future action cannot be added without the compiler demanding its field.
 */
const FIELD: Record<EngagementKind, keyof EngagementState> = {
  like: 'likes',
  save: 'saves',
  vote: 'votes',
  notify: 'notifies',
};

/** A visitor's own vote is weighted so the meter visibly responds to them. */
const OWN_VOTE_WEIGHT = 120;

export function EngagementProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useLocalStorage<EngagementState>('h2c.engagement', EMPTY);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { notify } = useToast();

  const isOn = useCallback(
    (kind: EngagementKind, id: string) => state[FIELD[kind]].includes(id),
    [state]
  );

  const toggle = useCallback(
    (kind: EngagementKind, id: string) => {
      const item = apparelById(id);
      if (!item) return;

      const field = FIELD[kind];
      const currentlyOn = state[field].includes(id);
      const next = currentlyOn
        ? state[field].filter((x) => x !== id)
        : [...state[field], id];

      setState({ ...state, [field]: next });

      const messages: Record<EngagementKind, [string, string]> = {
        like: [`Liked ${item.name}`, `Removed your like from ${item.name}`],
        save: [`Saved ${item.name}`, `Removed ${item.name} from saved`],
        vote: [`Voted for ${item.name}`, `Vote withdrawn from ${item.name}`],
        notify: [
          `We will tell you when ${item.name} is released`,
          `You will no longer be notified about ${item.name}`,
        ],
      };
      notify(currentlyOn ? messages[kind][1] : messages[kind][0]);

      // Fire-and-forget. Local intent is already recorded, so a network
      // failure here costs a count, not the interaction.
      void apiPost(API.apparel.engage(id, currentlyOn ? `${kind}/undo` : kind)).catch(() => {});
    },
    [state, setState, notify]
  );

  const count = useCallback(
    (kind: 'like' | 'vote', id: string) => {
      const item = apparelById(id);
      if (!item) return 0;
      const base = kind === 'like' ? item.likes : item.votes;
      return base + (isOn(kind, id) ? 1 : 0);
    },
    [isOn]
  );

  /**
   * Which collection the movement is actually asking for. This is the readout
   * that decides future releases, so a visitor's own votes are folded in
   * immediately — the meter has to feel answerable.
   */
  const voteTotals = useMemo(() => {
    const totals = COLLECTIONS.map((collection) => {
      const items = APPAREL.filter((a) => a.coll === collection.slug);
      const base = items.reduce((sum, a) => sum + a.votes, 0);
      const mine = items.reduce(
        (sum, a) => sum + (state.votes.includes(a.id) ? OWN_VOTE_WEIGHT : 0),
        0
      );
      return { slug: collection.slug, name: collection.name, value: base + mine };
    }).sort((a, b) => b.value - a.value);

    const max = totals[0]?.value || 1;
    return totals.map((t) => ({ ...t, percent: Math.round((t.value / max) * 100) }));
  }, [state.votes]);

  const value = useMemo<EngagementContextValue>(
    () => ({
      isOn,
      toggle,
      count,
      savedIds: state.saves,
      savedCount: state.saves.length,
      clearSaved: () => setState({ ...state, saves: [] }),
      voteTotals,
      isDrawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [isOn, toggle, count, state, setState, voteTotals, isDrawerOpen]
  );

  return <EngagementContext.Provider value={value}>{children}</EngagementContext.Provider>;
}

