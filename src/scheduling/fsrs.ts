import {
  DefaultScheduler,
  Rating,
  State,
  type DefaultScheduler as Scheduler,
  type DefaultSchedulerCard,
  type DefaultSchedulerRevlog,
} from 'ts-fsrs';

export { Rating, State };
export type FsrsCard = DefaultSchedulerCard;
export type FsrsRevlog = DefaultSchedulerRevlog;
export type { Scheduler };

/** The four answer buttons (Rating.Manual is excluded on purpose). */
export type ButtonGrade = 1 | 2 | 3 | 4;
export const BUTTON_GRADES: ButtonGrade[] = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];

export async function createScheduler(desiredRetention: number): Promise<Scheduler> {
  return DefaultScheduler({
    desiredRetention,
    enableShortTerm: true,
    learningSteps: ['1m', '10m'],
    relearningSteps: ['10m'],
    enableFuzz: true,
  });
}

export function newFsrsCard(scheduler: Scheduler, now: Date): FsrsCard {
  return scheduler.newCard({ now });
}

export function rateCard(
  scheduler: Scheduler,
  card: FsrsCard,
  grade: ButtonGrade,
  now: Date,
): { card: FsrsCard; revlog: FsrsRevlog } {
  return scheduler.review({ card, grade, now });
}

/** Next due date for every button, without changing the card. */
export function previewDueDates(scheduler: Scheduler, card: FsrsCard, now: Date): Record<ButtonGrade, Date> {
  const result = {} as Record<ButtonGrade, Date>;
  for (const item of scheduler.preview({ card, now })) {
    result[item.grade as ButtonGrade] = item.card.dueAt;
  }
  return result;
}

/** Human readable interval, e.g. "1m", "10m", "4d", "2mo", "1.2y". */
export function formatInterval(from: Date, to: Date): string {
  const minutes = Math.max(0, (to.getTime() - from.getTime()) / 60_000);
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = hours / 24;
  if (days < 30) return `${Math.round(days)}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}
