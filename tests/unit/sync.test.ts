import { afterEach, describe, expect, it, vi } from 'vitest';
import { createScheduler, newFsrsCard, Rating, rateCard } from '../../src/scheduling/fsrs';
import { createBackup, parseBackup, type Backup } from '../../src/storage/backup';
import { hasRemoteChanges, mergeBackups, syncWithGist } from '../../src/storage/sync';
import { DEFAULT_SETTINGS, type CardState, type ReviewLogEntry } from '../../src/storage/types';

const scheduler = await createScheduler(0.9);
const t0 = new Date('2026-11-01T10:00:00Z');

function reviewed(key: string, at: string): { card: CardState; log: ReviewLogEntry } {
  const { card, revlog } = rateCard(scheduler, newFsrsCard(scheduler, t0), Rating.Good, new Date(at));
  return {
    card: { key, noteId: key.split(':')[0]!, direction: 'de2tr', suspended: false, fsrs: card },
    log: { key, revlog },
  };
}

const backup = (cards: CardState[], logs: ReviewLogEntry[], streetPhrases: string[] = []): Backup =>
  // Round-trip through JSON like real exports.
  parseBackup(JSON.stringify(createBackup(cards, logs, { ...DEFAULT_SETTINGS, streetPhrases }, t0)));

describe('mergeBackups', () => {
  const phone = reviewed('a-0001:de2tr', '2026-11-05T10:00:00Z');
  const laptopOld = reviewed('a-0001:de2tr', '2026-11-03T10:00:00Z');
  const laptopOther = reviewed('b-0002:de2tr', '2026-11-04T10:00:00Z');

  it('keeps the most recently reviewed card state and unions the logs', () => {
    const local = backup([phone.card], [phone.log]);
    const remote = backup([laptopOld.card, laptopOther.card], [laptopOld.log, laptopOther.log], ['x|Moin!']);
    const merged = mergeBackups(local, remote, t0);
    const a = merged.cards.find((c) => c.key === 'a-0001:de2tr')!;
    expect(new Date(a.fsrs.lastReviewAt!).toISOString()).toBe('2026-11-05T10:00:00.000Z');
    expect(merged.cards).toHaveLength(2);
    expect(merged.logs).toHaveLength(3);
    expect(merged.logs.every((log) => log.id === undefined)).toBe(true);
    expect(merged.settings.streetPhrases).toEqual(['x|Moin!']);
    expect(hasRemoteChanges(local, merged)).toBe(true);
  });

  it('is idempotent: merging the same data twice adds nothing', () => {
    const local = backup([phone.card], [phone.log]);
    const merged = mergeBackups(local, local, t0);
    expect(merged.logs).toHaveLength(1);
    expect(hasRemoteChanges(local, merged)).toBe(false);
  });
});

describe('syncWithGist', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('creates a private gist on first sync and reports nothing to import', async () => {
    const calls: { url: string; method: string; body?: string }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: RequestInit = {}) => {
        calls.push({ url, method: init.method ?? 'GET', body: init.body as string | undefined });
        if (url.endsWith('/gists?per_page=100')) return new Response('[]', { status: 200 });
        return new Response(JSON.stringify({ id: 'g1', description: '', files: {} }), { status: 201 });
      }),
    );
    const local = JSON.stringify(createBackup([], [], DEFAULT_SETTINGS, t0));
    const result = await syncWithGist({ token: 't', gistId: null }, local, t0);
    expect(result).toEqual({ gistId: 'g1', imported: null });
    const create = calls.find((call) => call.method === 'POST')!;
    expect(JSON.parse(create.body!).public).toBe(false);
  });

  it('turns a 401 into a readable error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 401 })));
    const local = JSON.stringify(createBackup([], [], DEFAULT_SETTINGS, t0));
    await expect(syncWithGist({ token: 'bad', gistId: null }, local)).rejects.toThrow(/geçersiz/);
  });
});
