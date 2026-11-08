import { describe, expect, it } from 'vitest';
import { GRAMMAR_TOPICS } from '../../src/data/grammar';
import { filterTopics, groupByLevel, parseGrammar, parseInline, type GrammarTopicInput } from '../../src/domain/grammar';

// Small stable fixture for behaviour tests, independent of the real content.
const base = (id: string, level: GrammarTopicInput['level'], titleDe: string): GrammarTopicInput => ({
  id,
  level,
  category: 'verb',
  titleDe,
  titleTr: `${titleDe} (tr)`,
  summary: 'Kurz.',
  blocks: [{ type: 'examples', items: [{ de: `Beispiel für ${titleDe}`, tr: 'örnek' }] }],
});
const fixture = parseGrammar([base('praesens', 'A1', 'Präsens'), base('dativ', 'A2', 'Dativ'), base('passiv', 'B1', 'Passiv')]);

describe('grammar content', () => {
  it('is valid and covers every level', () => {
    const topics = parseGrammar(GRAMMAR_TOPICS);
    expect(new Set(topics.map((t) => t.level))).toEqual(new Set(['A1', 'A2', 'B1', 'B2']));
  });

  it('rejects duplicate ids', () => {
    expect(() => parseGrammar([base('x', 'A1', 'X'), base('x', 'A2', 'Y')])).toThrow(/duplicate id/);
  });

  it('rejects links to unknown topics', () => {
    expect(() => parseGrammar([{ ...base('x', 'A1', 'X'), related: ['nope'] }])).toThrow(/unknown related id/);
  });

  it('rejects table rows that do not match the head', () => {
    const broken = { ...base('x', 'A1', 'X'), blocks: [{ type: 'table' as const, head: ['a', 'b'], rows: [['1']] }] };
    expect(() => parseGrammar([broken])).toThrow(/row has 1 cells, head has 2/);
  });
});

describe('filterTopics', () => {
  it('filters by level', () => {
    expect(filterTopics(fixture, { level: 'A2', query: '' }).map((t) => t.id)).toEqual(['dativ']);
  });

  it('searches titles and examples case-insensitively', () => {
    expect(filterTopics(fixture, { level: 'all', query: 'PASSIV' }).map((t) => t.id)).toEqual(['passiv']);
    expect(filterTopics(fixture, { level: 'all', query: 'beispiel für dativ' }).map((t) => t.id)).toEqual(['dativ']);
  });

  it('groups by level in CEFR order and skips empty levels', () => {
    expect(groupByLevel([...fixture].reverse()).map((g) => g.level)).toEqual(['A1', 'A2', 'B1']);
  });
});

describe('parseInline', () => {
  it('splits **bold** markers', () => {
    expect(parseInline('ich **bin** da')).toEqual([
      { text: 'ich ', bold: false },
      { text: 'bin', bold: true },
      { text: ' da', bold: false },
    ]);
  });
});
