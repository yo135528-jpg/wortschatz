import { cardsFromNotes } from '../domain/cards';
import type { Note } from '../domain/schema';
import type { FsrsCard } from '../scheduling/fsrs';
import type { CardState } from './types';

export interface MergeResult {
  /** Cards that appear in cards.json but have no state yet. Must be inserted. */
  created: CardState[];
  /** State of every card that is currently in cards.json (existing + created). */
  active: CardState[];
  /** Keys that have state but are no longer in cards.json. Kept in storage, ignored by the app. */
  orphanedKeys: string[];
}

/**
 * Merges content (notes) with stored review state.
 * Pure function: it never touches IndexedDB, so it is easy to unit test.
 *
 * Rules:
 *  - new cards get fresh FSRS state from `createFresh`
 *  - existing state is never overwritten
 *  - state of cards removed from cards.json is ignored, not deleted
 */
export function mergeState(
  notes: Note[],
  existing: CardState[],
  createFresh: () => FsrsCard,
): MergeResult {
  const existingByKey = new Map(existing.map((state) => [state.key, state]));
  const created: CardState[] = [];
  const active: CardState[] = [];
  const activeKeys = new Set<string>();

  for (const ref of cardsFromNotes(notes)) {
    activeKeys.add(ref.key);
    const stored = existingByKey.get(ref.key);
    if (stored) {
      active.push(stored);
      continue;
    }
    const fresh: CardState = { ...ref, fsrs: createFresh(), suspended: false };
    created.push(fresh);
    active.push(fresh);
  }

  const orphanedKeys = existing.map((state) => state.key).filter((key) => !activeKeys.has(key));
  return { created, active, orphanedKeys };
}
