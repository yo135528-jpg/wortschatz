import { describe, expect, it } from 'vitest';
import { clozeAnswers, clozeSolved, clozeSyntaxErrors, clozeWithGaps, parseCloze } from '../../src/domain/cloze';

const separable = 'Wir [nehmen] morgen [an] einem Deutschkurs [teil].';

describe('cloze', () => {
  it('shows one gap per bracket on the front', () => {
    expect(clozeWithGaps(separable)).toBe('Wir ___ morgen ___ einem Deutschkurs ___.');
  });

  it('fills the answers in on the back', () => {
    expect(clozeSolved(separable)).toBe('Wir nehmen morgen an einem Deutschkurs teil.');
  });

  it('returns the answers in reading order', () => {
    expect(clozeAnswers(separable)).toEqual(['nehmen', 'an', 'teil']);
  });

  it('splits text and gaps so the back can highlight the answers', () => {
    expect(parseCloze('[Die] [Entscheidung] fiel schwer.')).toEqual([
      { kind: 'gap', answer: 'Die' },
      { kind: 'text', value: ' ' },
      { kind: 'gap', answer: 'Entscheidung' },
      { kind: 'text', value: ' fiel schwer.' },
    ]);
  });

  it('accepts a well-formed cloze', () => {
    expect(clozeSyntaxErrors(separable)).toEqual([]);
  });

  it('reports a cloze without gaps', () => {
    expect(clozeSyntaxErrors('Kein Gap hier.')).toContain('cloze needs at least one [answer] gap');
  });
});
