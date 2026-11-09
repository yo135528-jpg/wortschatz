import { describe, expect, it } from 'vitest';
import {
  createScheduler,
  formatInterval,
  newFsrsCard,
  previewDueDates,
  rateCard,
  Rating,
  State,
  type ButtonGrade,
} from '../../src/scheduling/fsrs';
import { buildQueue, countToday } from '../../src/scheduling/queue';
import { activityCalendar, computeStreak, dueForecast, groupProgress } from '../../src/scheduling/stats';
import { createBackup, parseBackup } from '../../src/storage/backup';
import { mergeState } from '../../src/storage/merge';
import { DEFAULT_SETTINGS, type CardState, type ReviewLogEntry } from '../../src/storage/types';
import { makeNote } from './helpers';

const now = new Date('2026-11-05T10:00:00.000Z');
const scheduler = await createScheduler(0.9);

function freshStates(ids: string[]): CardState[] {
  return mergeState(ids.map((id) => makeNote({ id })), [], () => newFsrsCard(scheduler, now)).active;
}

const options = { mode: 'mixed' as const, newPerDay: 15, reviewsPerDay: 200, now };

describe('ts-fsrs integration', () => {
  it('preview gives non-decreasing due dates from Again to Easy', () => {
    const due = previewDueDates(scheduler, newFsrsCard(scheduler, now), now);
    const grades: ButtonGrade[] = [1, 2, 3, 4];
    const times = grades.map((g) => due[g].getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(times[0]).toBeGreaterThan(now.getTime());
  });

  it('rating returns a new card and a log without mutating the input', () => {
    const card = newFsrsCard(scheduler, now);
    const snapshot = structuredClone(card);
    const { card: next, revlog } = rateCard(scheduler, card, Rating.Good, now);

    expect(card).toEqual(snapshot);
    expect(next.reps).toBe(1);
    expect(next.dueAt.getTime()).toBeGreaterThan(now.getTime());
    expect(revlog.rating).toBe(Rating.Good);
    expect(revlog.state).toBe(State.New);
  });

  it('Again on a new card puts it into short-term learning', () => {
    const { card } = rateCard(scheduler, newFsrsCard(scheduler, now), Rating.Again, now);
    expect(card.state).toBe(State.Learning);
    expect(card.dueAt.getTime() - now.getTime()).toBeLessThanOrEqual(10 * 60_000);
  });

  it('higher desired retention gives shorter intervals', async () => {
    const strict = await createScheduler(0.97);
    const relaxed = await createScheduler(0.8);
    const reviewed = (s: typeof scheduler) =>
      rateCard(s, newFsrsCard(s, now), Rating.Good, now).card;
    expect(reviewed(strict).dueAt.getTime()).toBeLessThan(reviewed(relaxed).dueAt.getTime());
  });

  it('formats intervals', () => {
    const at = (ms: number) => new Date(now.getTime() + ms);
    expect(formatInterval(now, at(60_000))).toBe('1m');
    expect(formatInterval(now, at(4 * 86_400_000))).toBe('4d');
    expect(formatInterval(now, at(60 * 86_400_000))).toBe('2mo');
  });
});

describe('buildQueue', () => {
  it('filters by mode without touching other direction', () => {
    const states = freshStates(['a-aaaa', 'b-bbbb']);
    const queue = buildQueue(states, [], { ...options, mode: 'tr2de' });
    expect(queue.every((s) => s.direction === 'tr2de')).toBe(true);
    expect(queue).toHaveLength(2);
  });

  it('introduces only one direction per note per day in mixed mode', () => {
    const queue = buildQueue(freshStates(['a-aaaa', 'b-bbbb']), [], options);
    expect(queue.map((s) => s.key)).toEqual(['a-aaaa:de2tr', 'b-bbbb:de2tr']);
  });

  it('respects the daily new-card limit, counting cards already introduced today', () => {
    const states = freshStates(['a-aaaa', 'b-bbbb', 'c-cccc', 'd-dddd']);
    const first = states[0]!;
    const { card, revlog } = rateCard(scheduler, first.fsrs, Rating.Good, now);
    const logs: ReviewLogEntry[] = [{ key: first.key, revlog }];
    const updated = states.map((s) => (s.key === first.key ? { ...s, fsrs: card } : s));

    expect(countToday(logs, now)).toEqual({ newDone: 1, reviewsDone: 0 });
    const queue = buildQueue(updated, logs, { ...options, newPerDay: 2 });
    expect(queue).toHaveLength(1);
  });

  it('skips suspended cards', () => {
    const states = freshStates(['a-aaaa']).map((s) => ({ ...s, suspended: true }));
    expect(buildQueue(states, [], options)).toEqual([]);
  });

  it('puts due reviews before new cards', () => {
    const [reviewCard, newCard] = freshStates(['a-aaaa', 'b-bbbb']).filter((s) => s.direction === 'de2tr');
    const past = new Date('2026-10-01T10:00:00.000Z');
    const reviewed = rateCard(scheduler, reviewCard!.fsrs, Rating.Good, past).card;
    const queue = buildQueue([newCard!, { ...reviewCard!, fsrs: reviewed }], [], options);
    expect(queue.map((s) => s.key)).toEqual(['a-aaaa:de2tr', 'b-bbbb:de2tr']);
  });
});

describe('streak', () => {
  const logAt = (iso: string): ReviewLogEntry => ({
    key: 'x',
    revlog: rateCard(scheduler, newFsrsCard(scheduler, new Date(iso)), Rating.Good, new Date(iso)).revlog,
  });

  it('counts consecutive days and survives a day without reviews yet', () => {
    const logs = [logAt('2026-11-02T12:00:00'), logAt('2026-11-03T12:00:00'), logAt('2026-11-04T12:00:00')];
    expect(computeStreak(logs, new Date('2026-11-05T12:00:00'))).toBe(3);
    expect(computeStreak(logs, new Date('2026-11-06T12:00:00'))).toBe(0);
  });
});

describe('backup', () => {
  it('round-trips state with Date objects restored', () => {
    const states = freshStates(['a-aaaa']);
    const first = states[0]!;
    const { card, revlog } = rateCard(scheduler, first.fsrs, Rating.Hard, now);
    const cards = [{ ...first, fsrs: card }, ...states.slice(1)];
    const logs: ReviewLogEntry[] = [{ id: 1, key: first.key, revlog }];

    const json = JSON.stringify(createBackup(cards, logs, DEFAULT_SETTINGS, now));
    const restored = parseBackup(json);

    expect(restored.cards).toEqual(cards);
    expect(restored.logs).toEqual(logs);
    expect(restored.cards[0]!.fsrs.dueAt).toBeInstanceOf(Date);
    // A restored card can be reviewed again.
    expect(() => rateCard(scheduler, restored.cards[0]!.fsrs, Rating.Good, now)).not.toThrow();
  });

  it('rejects unrelated JSON', () => {
    expect(() => parseBackup('{"hello":1}')).toThrow(/invalid/);
    expect(() => parseBackup('not json')).toThrow(/not valid JSON/);
  });
});

describe('progress charts', () => {
  const logAt = (iso: string): ReviewLogEntry => ({
    key: 'x',
    revlog: rateCard(scheduler, newFsrsCard(scheduler, new Date(iso)), Rating.Good, new Date(iso)).revlog,
  });
  const at = new Date('2026-11-05T12:00:00'); // a Thursday

  it('calendar covers whole weeks from Monday up to today and counts reviews per day', () => {
    const days = activityCalendar([logAt('2026-11-04T12:00:00'), logAt('2026-11-04T13:00:00')], at, 2);
    expect(days[0]!.label).toBe('2026-10-26');
    expect(days.at(-1)!.label).toBe('2026-11-05');
    expect(days).toHaveLength(11);
    expect(days.find((d) => d.label === '2026-11-04')!.count).toBe(2);
  });

  it('forecast puts overdue cards on day 0 and ignores new and suspended cards', () => {
    const [a, b, c, d] = freshStates(['a-0001', 'b-0002', 'c-0003', 'd-0004']);
    const studied = (state: CardState, due: string, suspended = false): CardState => ({
      ...state,
      suspended,
      fsrs: { ...state.fsrs, state: State.Review, dueAt: new Date(due) },
    });
    const states = [studied(a!, '2026-11-01T12:00:00'), studied(b!, '2026-11-06T12:00:00'), studied(c!, '2026-11-06T12:00:00', true), d!];
    expect(dueForecast(states, at, 3).map((day) => day.count)).toEqual([1, 1, 0]);
  });

  it('groups notes and counts started and mature notes', () => {
    const [a, b] = freshStates(['a-0001', 'b-0002']);
    const mature: CardState = { ...a!, fsrs: { ...a!.fsrs, state: State.Review, stability: 40 } };
    const progress = groupProgress(new Map([['a-0001', 'K1'], ['b-0002', 'K1'], ['c-0003', 'K2']]), [mature, b!]);
    expect(progress).toEqual([
      { label: 'K1', total: 2, started: 1, mature: 1 },
      { label: 'K2', total: 1, started: 0, mature: 0 },
    ]);
  });
});
