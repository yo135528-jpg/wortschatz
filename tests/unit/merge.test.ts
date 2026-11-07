import { describe, expect, it, vi } from 'vitest';
import { mergeState } from '../../src/storage/merge';
import { createScheduler, newFsrsCard, rateCard, Rating } from '../../src/scheduling/fsrs';
import type { CardState } from '../../src/storage/types';
import { makeNote } from './helpers';

const now = new Date('2026-11-05T10:00:00.000Z');
const scheduler = await createScheduler(0.9);
const fresh = () => newFsrsCard(scheduler, now);

describe('mergeState', () => {
  it('creates fresh state for both directions of a new note', () => {
    const result = mergeState([makeNote({ id: 'wort-aaaa' })], [], fresh);

    expect(result.created.map((s) => s.key)).toEqual(['wort-aaaa:de2tr', 'wort-aaaa:tr2de']);
    expect(result.active).toHaveLength(2);
    expect(result.created.every((s) => s.fsrs.reps === 0 && !s.suspended)).toBe(true);
  });

  it('creates only the directions listed on the note', () => {
    const result = mergeState([makeNote({ id: 'wort-aaaa', directions: ['de2tr'] })], [], fresh);
    expect(result.created.map((s) => s.direction)).toEqual(['de2tr']);
  });

  it('never overwrites existing state', () => {
    const reviewed = rateCard(scheduler, fresh(), Rating.Good, now).card;
    const existing: CardState = {
      key: 'wort-aaaa:de2tr',
      noteId: 'wort-aaaa',
      direction: 'de2tr',
      fsrs: reviewed,
      suspended: true,
    };
    const createFresh = vi.fn(fresh);

    const result = mergeState([makeNote({ id: 'wort-aaaa' })], [existing], createFresh);

    expect(result.active.find((s) => s.key === existing.key)).toBe(existing);
    expect(result.created.map((s) => s.key)).toEqual(['wort-aaaa:tr2de']);
    expect(createFresh).toHaveBeenCalledTimes(1);
  });

  it('ignores state of removed notes without deleting it', () => {
    const orphan: CardState = {
      key: 'alt-bbbb:de2tr',
      noteId: 'alt-bbbb',
      direction: 'de2tr',
      fsrs: fresh(),
      suspended: false,
    };

    const result = mergeState([makeNote({ id: 'wort-aaaa' })], [orphan], fresh);

    expect(result.active.some((s) => s.key === orphan.key)).toBe(false);
    expect(result.orphanedKeys).toEqual([orphan.key]);
    expect(result.created.some((s) => s.key === orphan.key)).toBe(false);
  });

  it('is a no-op when every card already has state', () => {
    const first = mergeState([makeNote({ id: 'wort-aaaa' })], [], fresh);
    const second = mergeState([makeNote({ id: 'wort-aaaa' })], first.active, fresh);
    expect(second.created).toEqual([]);
    expect(second.active).toEqual(first.active);
  });
});
