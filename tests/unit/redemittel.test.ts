import { describe, expect, it } from 'vitest';
import { REDEMITTEL } from '../../src/data/redemittel';
import { redemittelQuestions } from '../../src/domain/drills';
import { parseRedemittel, searchRedemittel, type RedemittelGroupInput } from '../../src/domain/redemittel';

const group = (id: string, phrases: string[]): RedemittelGroupInput => ({
  id,
  icon: '💬',
  titleDe: id,
  titleTr: id,
  summaryTr: 'test',
  skill: 'beide',
  items: phrases.map((de) => ({ de, tr: `${de} (tr)`, example: { de: `${de} Beispiel.`, tr: 'örnek' } })),
});

describe('redemittel', () => {
  it('the real content is valid', () => {
    const groups = parseRedemittel(REDEMITTEL);
    expect(groups.length).toBeGreaterThan(5);
    // Every example is a full sentence, not a copy of the pattern with "…".
    for (const item of groups.flatMap((g) => g.items)) expect(item.example.de).not.toContain('…');
  });

  it('rejects duplicate ids and duplicate phrases', () => {
    expect(() => parseRedemittel([group('a', ['x', 'y', 'z']), group('a', ['p', 'q', 'r'])])).toThrow(/Duplicate Redemittel group id/);
    expect(() => parseRedemittel([group('a', ['x', 'y', 'z']), group('b', ['x', 'q', 'r'])])).toThrow(/Duplicate Redemittel phrase/);
  });

  it('search matches German and Turkish, case-insensitively', () => {
    const groups = parseRedemittel([group('a', ['Meiner Meinung nach …', 'y', 'z']), group('b', ['p', 'q', 'r'])]);
    expect(searchRedemittel(groups, 'meinung').map((hit) => hit.item.de)).toEqual(['Meiner Meinung nach …']);
    expect(searchRedemittel(groups, '  ')).toEqual([]);
  });

  it('quiz: four options, the wrong ones come from other groups', () => {
    const groups = parseRedemittel([group('a', ['a1', 'a2', 'a3']), group('b', ['b1', 'b2', 'b3'])]);
    const question = redemittelQuestions(groups).find((q) => q.id === 'a#0')!;
    const field = question.fields[0]!;
    if (field.kind !== 'choice') throw new Error('expected a choice field');
    expect(field.answer).toBe('a1');
    expect(field.options).toHaveLength(4);
    expect(field.options.filter((option) => option.startsWith('a'))).toEqual(['a1']);
    expect(question.skill).toBe('kalip:a');
  });
});
