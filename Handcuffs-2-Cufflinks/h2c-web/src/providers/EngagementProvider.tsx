import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from './context/toast';
import { useMember } from './context/member';
import { fetchMemberEngagement } from './memberEngagement';
import { EngagementContext } from './context/engagement';
import type { EngagementContextValue, EngagementKind } from './context/engagement';
import { APPAREL as APPAREL_SEED } from '@/data/apparel';
import { COLLECTIONS as COLLECTIONS_SEED } from '@/data/collections';
import { apiPost } from '@/lib/api/client';
import { API } from '@/lib/api/endpoints';
import { useContent } from '@/lib/api/useContent';
import { toApparel, toCollection } from '@/lib/content/adapters';
import type { ApiApparelItem, ApiCollection } from '@/lib/content/adapters';

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

/** Merges two id lists without duplicates. */
function union(a: string[], b: string[] | undefined): string[] {
  return Array.from(new Set([...a, ...(b ?? [])]));
}

export function EngagementProvider({ children }: { children: React.ReactNode }) {
  /**
   * The provider holds the catalogue because three separate places need to turn
   * an id into a garment — the toggle messages, the like and vote counts, and
   * the saved drawer — and fetching it three times to answer the same question
   * would be three requests for one answer.
   */
  const { items: collections } = useContent<ApiCollection, (typeof COLLECTIONS_SEED)[number]>(
    '/collections',
    toCollection,
    COLLECTIONS_SEED
  );

  const { items: catalogue } = useContent<ApiApparelItem, (typeof APPAREL_SEED)[number]>(
    '/apparel',
    toApparel,
    APPAREL_SEED,
    { params: { pageSize: 100 } }
  );

  const itemById = useCallback(
    (id: string) => catalogue.find((item) => item.id === id),
    [catalogue]
  );

  const [state, setState] = useLocalStorage<EngagementState>('h2c.engagement', EMPTY);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const { notify } = useToast();
  const { status: memberStatus } = useMember();

  /**
   * When a member signs in, their reactions are pulled from the server and
   * merged into local state.
   *
   * This is the point of having an account: a like registered on a phone shows
   * up on a laptop. Merged rather than replaced, so anything reacted to
   * anonymously in this browser before signing in is not silently dropped —
   * the server claims those rows at sign-in, and this keeps the UI in step.
   */
  useEffect(() => {
    if (memberStatus !== 'signed-in') return;
    let cancelled = false;

    void fetchMemberEngagement().then((remote) => {
      if (!remote || cancelled) return;
      setState((current) => ({
        likes: union(current.likes, remote.like),
        saves: union(current.saves, remote.favorite),
        votes: union(current.votes, remote.vote),
        notifies: union(current.notifies, remote.notify),
      }));
    });

    return () => {
      cancelled = true;
    };
    // setState is stable; re-running on state changes would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberStatus]);

  const isOn = useCallback(
    (kind: EngagementKind, id: string) => state[FIELD[kind]].includes(id),
    [state]
  );

  const toggle = useCallback(
    (kind: EngagementKind, id: string) => {
      const item = itemById(id);
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
    [state, setState, notify, itemById]
  );

  const count = useCallback(
    (kind: 'like' | 'vote', id: string) => {
      const item = itemById(id);
      if (!item) return 0;
      const base = kind === 'like' ? item.likes : item.votes;
      return base + (isOn(kind, id) ? 1 : 0);
    },
    [isOn, itemById]
  );

  /**
   * Which collection the movement is actually asking for. This is the readout
   * that decides future releases, so a visitor's own votes are folded in
   * immediately — the meter has to feel answerable.
   */
  const voteTotals = useMemo(() => {
    const totals = collections.map((collection) => {
      const items = catalogue.filter((a) => a.coll === collection.slug);
      const base = items.reduce((sum, a) => sum + a.votes, 0);
      const mine = items.reduce(
        (sum, a) => sum + (state.votes.includes(a.id) ? OWN_VOTE_WEIGHT : 0),
        0
      );
      return { slug: collection.slug, name: collection.name, value: base + mine };
    }).sort((a, b) => b.value - a.value);

    const max = totals[0]?.value || 1;
    return totals.map((t) => ({ ...t, percent: Math.round((t.value / max) * 100) }));
  }, [state.votes, collections, catalogue]);

  const value = useMemo<EngagementContextValue>(
    () => ({
      isOn,
      toggle,
      count,
      itemById,
      savedIds: state.saves,
      savedCount: state.saves.length,
      clearSaved: () => setState({ ...state, saves: [] }),
      voteTotals,
      isDrawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [isOn, toggle, count, itemById, state, setState, voteTotals, isDrawerOpen]
  );

  return <EngagementContext.Provider value={value}>{children}</EngagementContext.Provider>;
}

