import { describe, expect, it } from 'vitest';
import { checkAnswer, diffWords, levenshtein, normalizeAnswer } from '../../src/domain/answer';

describe('normalizeAnswer', () => {
  it('ignores case, extra spaces, quotes and sentence punctuation', () => {
    expect(normalizeAnswer('  Die   Entscheidung! ')).toBe('die entscheidung');
    expect(normalizeAnswer('„Hast du’s?“')).toBe("hast du's");
  });
});

describe('checkAnswer', () => {
  it('accepts exact answers and any accepted alternative', () => {
    expect(checkAnswer('die Entscheidung', ['die Entscheidung'])).toBe('correct');
    expect(checkAnswer('entscheiden', ['sich entscheiden', 'entscheiden'])).toBe('correct');
  });

  it('treats one typo or a missing umlaut as almost', () => {
    expect(checkAnswer('die Entscheidnug', ['die Entscheidung'])).toBe('almost');
    expect(checkAnswer('muede', ['müde'])).toBe('almost');
    expect(checkAnswer('Strasse', ['Straße'])).toBe('almost');
  });

  it('is strict for short words and wrong for other words', () => {
    expect(checkAnswer('dem', ['den'])).toBe('wrong');
    expect(checkAnswer('der Entscheidung', ['die Entscheidung'])).toBe('wrong');
    expect(checkAnswer('', ['auf'])).toBe('wrong');
  });

  it('allows small slips in long sentences', () => {
    expect(checkAnswer('Ich habe heute keine zeit', ['Ich habe heute keine Zeit.'])).toBe('correct');
    expect(checkAnswer('Ich habe heute kiene Zeit', ['Ich habe heute keine Zeit.'])).toBe('almost');
  });
});

describe('levenshtein', () => {
  it('counts edits', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('', 'ab')).toBe(2);
    expect(levenshtein('ung', 'nug')).toBe(1);
  });
});

describe('diffWords', () => {
  it('marks missing and extra words against the expected sentence', () => {
    expect(diffWords('ich habe Zeit heute', 'Ich habe heute Zeit.')).toEqual([
      { text: 'Ich', kind: 'ok' },
      { text: 'habe', kind: 'ok' },
      { text: 'heute', kind: 'missing' },
      { text: 'Zeit.', kind: 'ok' },
      { text: 'heute', kind: 'extra' },
    ]);
  });
});
