import { describe, expect, it } from 'vitest';
import { State, createScheduler, newFsrsCard } from '../../src/scheduling/fsrs';
import type { CardState } from '../../src/storage/types';
import {
  buildRows,
  cardScheduleLabel,
  filterRows,
  groupBySource,
  groupLabel,
  noteStatus,
  sortRows,
  summarize,
} from '../../src/ui/browseModel';
import { makeNote } from './helpers';

const now = new Date('2026-11-05T10:00:00.000Z');
const scheduler = await createScheduler(0.9);

function card(noteId: string, overrides: Partial<CardState['fsrs']> = {}, suspended = false): CardState {
  return {
    key: `${noteId}:de2tr`,
    noteId,
    direction: 'de2tr',
    fsrs: { ...newFsrsCard(scheduler, now), ...overrides },
    suspended,
  };
}

describe('noteStatus', () => {
  it('is new while no card has been studied', () => {
    expect(noteStatus([card('a'), card('a')])).toBe('new');
  });

  it('is learning when any active card is in progress', () => {
    expect(noteStatus([card('a'), card('a', { state: State.Learning })])).toBe('learning');
    expect(noteStatus([card('a', { state: State.Review, stability: 3 })])).toBe('learning');
  });

  it('is mature only when every active card has a long stability', () => {
    expect(noteStatus([card('a', { state: State.Review, stability: 30 })])).toBe('mature');
  });

  it('ignores suspended cards, and is suspended when all are', () => {
    const mature = card('a', { state: State.Review, stability: 30 });
    expect(noteStatus([mature, card('a', {}, true)])).toBe('mature');
    expect(noteStatus([card('a', {}, true)])).toBe('suspended');
  });
});

describe('rows', () => {
  const notes = [
    makeNote({ id: 'zebra-aaaa', lemma: 'Zebra', source: 'Kursbuch, Kapitel 1, S. 13' }),
    makeNote({ id: 'apfel-bbbb', lemma: 'Apfel', source: 'Kursbuch, Kapitel 1, S. 14', createdAt: '2026-11-06' }),
    makeNote({ id: 'mond-cccc', lemma: 'Mond', source: 'Kursbuch, Kapitel 1, S. 13' }),
  ];
  const states = [card('zebra-aaaa', { state: State.Review, stability: 5, lapses: 3 }), card('apfel-bbbb')];
  const rows = buildRows(notes, states);

  it('sums lapses per note and filters hard notes', () => {
    expect(rows.map((r) => r.lapses)).toEqual([3, 0, 0]);
    expect(filterRows(rows, { query: '', type: 'all', status: 'hard' }).map((r) => r.note.lemma)).toEqual(['Zebra']);
  });

  it('sorts alphabetically, by newest and by hardest', () => {
    expect(sortRows(rows, 'alpha').map((r) => r.note.lemma)).toEqual(['Apfel', 'Mond', 'Zebra']);
    expect(sortRows(rows, 'newest')[0]?.note.lemma).toBe('Apfel');
    expect(sortRows(rows, 'hardest')[0]?.note.lemma).toBe('Zebra');
  });

  it('groups by page in order of first appearance', () => {
    expect(groupBySource(rows).map((g) => [g.label, g.rows.length])).toEqual([
      ['Kapitel 1 · S. 13', 2],
      ['Kapitel 1 · S. 14', 1],
    ]);
    expect(groupLabel('B2 book, Kapitel 3')).toBe('B2 book · Kapitel 3');
  });

  it('summarizes notes, cards and statuses', () => {
    const summary = summarize(rows);
    expect(summary.notes).toBe(3);
    expect(summary.cards).toBe(6);
    expect(summary.byStatus).toEqual({ new: 2, learning: 1, mature: 0, suspended: 0 });
    expect(summary.hard).toBe(1);
  });
});

describe('cardScheduleLabel', () => {
  const at = (iso: string) => new Date(iso);

  it('says suspended cards are not asked', () => {
    expect(cardScheduleLabel(card('a', { state: State.Review }, true), now)).toBe('Sorulmuyor');
  });

  it('says new cards have not been studied yet', () => {
    expect(cardScheduleLabel(card('a'), now)).toBe('Henüz çalışılmadı');
  });

  it('uses today/tomorrow for near due dates, overdue counts as today', () => {
    expect(cardScheduleLabel(card('a', { state: State.Review, dueAt: at('2026-11-01T10:00:00Z') }), now)).toBe(
      'Sonraki tekrar: bugün',
    );
    expect(cardScheduleLabel(card('a', { state: State.Learning, dueAt: now }), now)).toBe('Sonraki tekrar: bugün');
    expect(cardScheduleLabel(card('a', { state: State.Review, dueAt: at('2026-11-06T10:00:00Z') }), now)).toBe(
      'Sonraki tekrar: yarın',
    );
  });

  it('shows day and month, and the year only when it differs', () => {
    expect(cardScheduleLabel(card('a', { state: State.Review, dueAt: at('2026-11-20T10:00:00Z') }), now)).toBe(
      'Sonraki tekrar: 20 Kasım',
    );
    expect(cardScheduleLabel(card('a', { state: State.Review, dueAt: at('2027-01-15T10:00:00Z') }), now)).toBe(
      'Sonraki tekrar: 15 Ocak 2027',
    );
  });
});
