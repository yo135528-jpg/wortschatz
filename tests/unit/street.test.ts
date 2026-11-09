import { describe, expect, it } from 'vitest';
import { STREET_TOPICS } from '../../src/data/street';
import {
  REGISTERS,
  parseStreet,
  registerCounts,
  searchPhrases,
  type StreetPhrase,
  type StreetTopicInput,
} from '../../src/domain/street';

// Small stable fixture for behaviour tests, independent of the real content.
const phrase = (de: string, tr: string, register: StreetPhrase['register'], extra: Partial<StreetPhrase> = {}): StreetPhrase => ({
  de,
  tr,
  register,
  ...extra,
});
const base = (id: string, items: StreetPhrase[]): StreetTopicInput => ({
  id,
  icon: '💬',
  titleTr: id,
  titleDe: id,
  intro: 'Kurz.',
  blocks: [{ type: 'phrases', items }],
});
const fixture = parseStreet([
  base('money', [
    phrase('Ich bin **pleite**.', 'Beş parasızım.', 'locker'),
    phrase('die Kohle', 'para', 'locker', { example: { de: 'Hast du Kohle dabei?', tr: 'Yanında para var mı?' } }),
  ]),
  base('regions', [phrase('Moin!', 'Selam!', 'regional', { region: 'Norden' }), phrase('Hallo!', 'Merhaba!', 'alltag')]),
]);

describe('street content', () => {
  it('is valid and uses every register', () => {
    const topics = parseStreet(STREET_TOPICS);
    const used = new Set(topics.flatMap((t) => t.blocks.flatMap((b) => (b.type === 'phrases' ? b.items.map((i) => i.register) : []))));
    expect(used).toEqual(new Set(REGISTERS));
  });

  it('rejects duplicate ids and unknown related topics', () => {
    const one = base('x', [phrase('a', 'b', 'alltag')]);
    expect(() => parseStreet([one, one])).toThrow(/duplicate id/);
    expect(() => parseStreet([{ ...one, related: ['nope'] }])).toThrow(/unknown related id/);
  });

  it('requires a region for regional phrases', () => {
    expect(() => parseStreet([base('x', [phrase('Moin!', 'Selam!', 'regional')])])).toThrow(/needs a region/);
  });

  it('requires at least one phrases block per topic', () => {
    const empty = { ...base('x', [phrase('a', 'b', 'alltag')]), blocks: [{ type: 'text' as const, text: 'nur Text' }] };
    expect(() => parseStreet([empty])).toThrow(/no phrases block/);
  });
});

describe('searchPhrases', () => {
  it('returns every phrase when there is no filter', () => {
    expect(searchPhrases(fixture, { register: 'all', query: '' })).toHaveLength(4);
  });

  it('filters by register', () => {
    expect(searchPhrases(fixture, { register: 'regional', query: '' }).map((hit) => hit.phrase.de)).toEqual(['Moin!']);
  });

  it('searches German without bold markers, Turkish and examples, case-insensitively', () => {
    expect(searchPhrases(fixture, { register: 'all', query: 'bin pleite' }).map((h) => h.topic.id)).toEqual(['money']);
    expect(searchPhrases(fixture, { register: 'all', query: 'PARASIZ' })).toHaveLength(1);
    expect(searchPhrases(fixture, { register: 'all', query: 'dabei' }).map((h) => h.phrase.de)).toEqual(['die Kohle']);
  });

  it('searches the region', () => {
    expect(searchPhrases(fixture, { register: 'all', query: 'norden' }).map((h) => h.phrase.de)).toEqual(['Moin!']);
  });
});

describe('registerCounts', () => {
  it('counts phrases per register', () => {
    expect(registerCounts(fixture[1]!)).toEqual({ regional: 1, alltag: 1 });
  });
});
