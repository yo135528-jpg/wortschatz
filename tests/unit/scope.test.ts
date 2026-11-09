import { describe, expect, it } from 'vitest';
import { chapterOf, inScope, pageOf, scopeOptions } from '../../src/domain/scope';
import { makeNote } from './helpers';

const k1 = makeNote({ id: 'a-0001', source: 'Kursbuch, Kapitel 1, S. 13' });
const k2 = makeNote({ id: 'b-0002', source: 'Kursbuch, Kapitel 2, S. 26' });
const alltag = makeNote({ id: 'c-0003', source: 'Alltagssprache, Kapitel 1 (Diskussion S. 17)' });

describe('scope', () => {
  it('derives chapter and page labels from the source', () => {
    expect(chapterOf(k1.source)).toBe('Kapitel 1');
    expect(pageOf(k1.source)).toBe('Kapitel 1 · S. 13');
    expect(chapterOf(alltag.source)).toBe('Alltagssprache');
  });

  it('filters notes by chapter or page', () => {
    expect(inScope(k1, '')).toBe(true);
    expect(inScope(k1, 'c:Kapitel 1')).toBe(true);
    expect(inScope(k2, 'c:Kapitel 1')).toBe(false);
    expect(inScope(k2, 'p:Kapitel 2 · S. 26')).toBe(true);
    expect(inScope(alltag, 'c:Kapitel 1')).toBe(false);
  });

  it('lists chapters and pages in book order without duplicates', () => {
    expect(scopeOptions([k1, k2, alltag, k1]).chapters).toEqual(['Kapitel 1', 'Kapitel 2', 'Alltagssprache']);
  });
});
