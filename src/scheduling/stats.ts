import type { CardState, ReviewLogEntry } from '../storage/types';
import { endOfStudyDay, studyDayLabel } from './day';
import { Rating, State } from './fsrs';

export interface Stats {
  dueToday: number;
  newCards: number;
  learned: number;
  /** Share of passed reviews (not "Again") of mature cards in the last 30 days; null if no data. */
  retention: number | null;
  /** Consecutive study days with at least one review, ending today or yesterday. */
  streak: number;
}

const RETENTION_WINDOW_DAYS = 30;

export function computeStats(states: CardState[], logs: ReviewLogEntry[], now: Date): Stats {
  const active = states.filter((s) => !s.suspended);
  const dayEnd = endOfStudyDay(now);

  const dueToday = active.filter((s) => s.fsrs.state !== State.New && s.fsrs.dueAt < dayEnd).length;
  const newCards = active.filter((s) => s.fsrs.state === State.New).length;
  const learned = active.filter((s) => s.fsrs.state !== State.New).length;

  const windowStart = new Date(now.getTime() - RETENTION_WINDOW_DAYS * 86_400_000);
  const recentReviews = logs.filter((l) => l.revlog.reviewTime >= windowStart && l.revlog.state === State.Review);
  const passed = recentReviews.filter((l) => l.revlog.rating !== Rating.Again).length;
  const retention = recentReviews.length ? passed / recentReviews.length : null;

  return { dueToday, newCards, learned, retention, streak: computeStreak(logs, now) };
}

export function computeStreak(logs: ReviewLogEntry[], now: Date): number {
  const days = new Set(logs.map((l) => studyDayLabel(l.revlog.reviewTime)));
  const cursor = new Date(now);
  // A streak is still alive if today has no reviews yet but yesterday has.
  if (!days.has(studyDayLabel(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(studyDayLabel(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
