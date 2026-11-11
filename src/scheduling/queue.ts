import type { CardState, ReviewLogEntry, StudyMode } from '../storage/types';
import { endOfStudyDay, startOfStudyDay } from './day';
import { State } from './fsrs';

export interface QueueOptions {
  mode: StudyMode;
  newPerDay: number;
  reviewsPerDay: number;
  now: Date;
}

export interface TodayCounts {
  newDone: number;
  reviewsDone: number;
}

/** Counts how many new cards were introduced and reviews done in the current study day. */
export function countToday(logs: ReviewLogEntry[], now: Date): TodayCounts {
  const start = startOfStudyDay(now);
  let newDone = 0;
  let reviewsDone = 0;
  for (const { revlog } of logs) {
    if (revlog.reviewTime < start) continue;
    // revlog.state is the state BEFORE the review.
    if (revlog.state === State.New) newDone++;
    else if (revlog.state === State.Review) reviewsDone++;
  }
  return { newDone, reviewsDone };
}

export function matchesMode(state: CardState, mode: StudyMode): boolean {
  return mode === 'mixed' || state.direction === mode;
}

/**
 * Builds the study queue for "now".
 * Order: due learning/relearning cards, then due reviews (most overdue first), then new cards.
 * The mode only filters cards; each direction keeps its own schedule.
 */
export function buildQueue(states: CardState[], logs: ReviewLogEntry[], options: QueueOptions): CardState[] {
  const { mode, now } = options;
  const today = countToday(logs, now);
  const candidates = states.filter((state) => !state.suspended && matchesMode(state, mode));
  const byDue = (a: CardState, b: CardState) => a.fsrs.dueAt.getTime() - b.fsrs.dueAt.getTime();

  // Short-term steps (1m/10m) are shown as soon as they are due.
  const learning = candidates
    .filter((s) => (s.fsrs.state === State.Learning || s.fsrs.state === State.Relearning) && s.fsrs.dueAt <= now)
    .sort(byDue);

  const dayEnd = endOfStudyDay(now);
  const reviewBudget = Math.max(0, options.reviewsPerDay - today.reviewsDone);
  const reviews = candidates
    .filter((s) => s.fsrs.state === State.Review && s.fsrs.dueAt < dayEnd)
    .sort(byDue)
    .slice(0, reviewBudget);

  // Sibling rule: never introduce both directions of the same note on the same day.
  const newBudget = Math.max(0, options.newPerDay - today.newDone);
  const startedToday = notesStartedToday(states, logs, now);
  const newCards: CardState[] = [];
  for (const state of candidates) {
    if (newCards.length >= newBudget) break;
    if (state.fsrs.state !== State.New || startedToday.has(state.noteId)) continue;
    startedToday.add(state.noteId);
    newCards.push(state);
  }

  const queue = [...learning, ...reviews, ...newCards];
  if (queue.length > 0) return queue;

  // Learn-ahead: when nothing else is left, show learning cards due within 20 minutes
  // instead of making the user wait.
  const learnAheadLimit = new Date(now.getTime() + LEARN_AHEAD_MINUTES * 60_000);
  return candidates
    .filter(
      (s) =>
        (s.fsrs.state === State.Learning || s.fsrs.state === State.Relearning) && s.fsrs.dueAt <= learnAheadLimit,
    )
    .sort(byDue);
}

export const LEARN_AHEAD_MINUTES = 20;

/**
 * Moves the focused cards to the front, keeping the book order inside both groups.
 * Only the order of NEW cards depends on the list order, so this decides what is introduced first.
 */
export function prioritize<T>(states: T[], isFocus: (state: T) => boolean): T[] {
  const focus: T[] = [];
  const rest: T[] = [];
  for (const state of states) (isFocus(state) ? focus : rest).push(state);
  return focus.length ? [...focus, ...rest] : states;
}

function notesStartedToday(states: CardState[], logs: ReviewLogEntry[], now: Date): Set<string> {
  const start = startOfStudyDay(now);
  const noteByKey = new Map(states.map((s) => [s.key, s.noteId]));
  const notes = new Set<string>();
  for (const { key, revlog } of logs) {
    if (revlog.reviewTime >= start && revlog.state === State.New) {
      const noteId = noteByKey.get(key);
      if (noteId) notes.add(noteId);
    }
  }
  return notes;
}

/** Time of the next learning step due later today, so the UI can say "come back in 5m". */
export function nextLearningDue(states: CardState[], mode: StudyMode, now: Date): Date | null {
  const dayEnd = endOfStudyDay(now);
  const upcoming = states
    .filter(
      (s) =>
        !s.suspended &&
        matchesMode(s, mode) &&
        (s.fsrs.state === State.Learning || s.fsrs.state === State.Relearning) &&
        s.fsrs.dueAt > now &&
        s.fsrs.dueAt < dayEnd,
    )
    .map((s) => s.fsrs.dueAt.getTime());
  return upcoming.length ? new Date(Math.min(...upcoming)) : null;
}
