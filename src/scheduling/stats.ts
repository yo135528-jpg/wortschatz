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

// ---------- Progress charts ----------

export interface DayCount {
  /** Study-day label "YYYY-MM-DD". */
  label: string;
  count: number;
}

/**
 * Reviews per study day for a calendar heatmap: `weeks` full weeks (Monday first),
 * ending with the current week. Future days of this week are left out.
 */
export function activityCalendar(logs: ReviewLogEntry[], now: Date, weeks = 18): DayCount[] {
  const counts = new Map<string, number>();
  for (const { revlog } of logs) {
    const label = studyDayLabel(revlog.reviewTime);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const today = new Date(`${studyDayLabel(now)}T12:00:00`);
  const mondayOffset = (today.getDay() + 6) % 7;
  const start = new Date(today);
  start.setDate(today.getDate() - mondayOffset - (weeks - 1) * 7);
  const days: DayCount[] = [];
  for (const cursor = new Date(start); cursor <= today; cursor.setDate(cursor.getDate() + 1)) {
    const label = studyDayLabel(cursor);
    days.push({ label, count: counts.get(label) ?? 0 });
  }
  return days;
}

/** Studied cards due per day for the next `days` days; day 0 includes overdue cards. */
export function dueForecast(states: CardState[], now: Date, days = 7): DayCount[] {
  const result: DayCount[] = [];
  const firstEnd = endOfStudyDay(now);
  for (let i = 0; i < days; i++) {
    const end = new Date(firstEnd);
    end.setDate(end.getDate() + i);
    const start = new Date(end);
    start.setDate(start.getDate() - 1);
    const count = states.filter(
      (s) =>
        !s.suspended &&
        s.fsrs.state !== State.New &&
        s.fsrs.dueAt < end &&
        (i === 0 || s.fsrs.dueAt >= start),
    ).length;
    result.push({ label: studyDayLabel(start), count });
  }
  return result;
}

export interface GroupProgress {
  label: string;
  /** Notes in the group. */
  total: number;
  /** Notes with at least one studied card. */
  started: number;
  /** Notes whose studied cards all have a long stability (>= 21 days). */
  mature: number;
}

/** Learning progress per chapter (or any grouping of notes). */
export function groupProgress(
  noteGroups: Map<string, string>,
  states: CardState[],
  matureDays = 21,
): GroupProgress[] {
  const byNote = new Map<string, CardState[]>();
  for (const state of states) byNote.set(state.noteId, [...(byNote.get(state.noteId) ?? []), state]);
  const groups = new Map<string, GroupProgress>();
  for (const [noteId, label] of noteGroups) {
    const group = groups.get(label) ?? { label, total: 0, started: 0, mature: 0 };
    group.total++;
    const studied = (byNote.get(noteId) ?? []).filter((s) => s.fsrs.state !== State.New);
    if (studied.length) group.started++;
    if (studied.length && studied.every((s) => s.fsrs.stability >= matureDays)) group.mature++;
    groups.set(label, group);
  }
  return [...groups.values()];
}
