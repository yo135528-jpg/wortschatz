import { describe, expect, it } from 'vitest';
import { audioId, speechTexts } from '../../src/domain/speech';
import { makeNote } from './helpers';

describe('speech', () => {
  it('gives the same id for the same text regardless of whitespace', () => {
    expect(audioId('Guten  Tag ')).toBe(audioId('Guten Tag'));
    expect(audioId('Guten Tag')).toMatch(/^[0-9a-f]{8}$/);
    expect(audioId('Guten Tag')).not.toBe(audioId('Guten Abend'));
  });

  it('collects headword, examples and solved cloze without duplicates', () => {
    const note = makeNote({
      id: 'satz-aaaa',
      lemma: 'Satz',
      cloze: 'Ein [kurzer] Satz.',
      examples: [{ de: 'Ein kurzer Satz.', fromBook: true }],
    });
    expect(speechTexts(note)).toEqual(['Satz', 'Ein kurzer Satz.']);
  });
});
