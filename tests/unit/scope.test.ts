import { describe, expect, it } from 'vitest';
import { chapterOf, inScope, pageOf, scopeOptions, sortByBook } from '../../src/domain/scope';
import { makeNote } from './helpers';

const k1 = makeNote({ id: 'a-0001', source: 'Kursbuch, Kapitel 1, S. 13' });
const k2 = makeNote({ id: 'b-0002', source: 'Kursbuch, Kapitel 2, S. 26' });
const ab1 = makeNote({ id: 'd-0004', source: 'Arbeitsbuch, Kapitel 1, S. 10' });
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

describe('Arbeitsbuch pages', () => {
  it('belong to the same chapter as the Kursbuch and get their own page label', () => {
    expect(chapterOf(ab1.source)).toBe('Kapitel 1');
    expect(pageOf(ab1.source)).toBe('Kapitel 1 · AB S. 10');
    expect(inScope(ab1, 'c:Kapitel 1')).toBe(true);
    expect(inScope(ab1, 'c:Kapitel 2')).toBe(false);
    expect(inScope(ab1, 'p:Kapitel 1 · AB S. 10')).toBe(true);
    expect(inScope(k1, 'p:Kapitel 1 · AB S. 10')).toBe(false);
  });

  it('still understands scopes stored before the change', () => {
    expect(inScope(ab1, 'c:Arbeitsbuch')).toBe(true);
    expect(inScope(k1, 'c:Arbeitsbuch')).toBe(false);
    expect(inScope(ab1, 'p:Arbeitsbuch · Kapitel 1 · S. 10')).toBe(true);
  });

  it('sorts notes chapter by chapter: Kursbuch, Arbeitsbuch, extras; stable inside a page', () => {
    const ab1b = makeNote({ id: 'e-0005', source: 'Arbeitsbuch, Kapitel 1, S. 10' });
    const ab1early = makeNote({ id: 'f-0006', source: 'Arbeitsbuch, Kapitel 1, S. 9' });
    const other = makeNote({ id: 'g-0007', source: 'Podcast' });
    const sorted = sortByBook([k2, other, ab1, alltag, ab1b, k1, ab1early]);
    expect(sorted.map((note) => note.id)).toEqual(['a-0001', 'f-0006', 'd-0004', 'e-0005', 'c-0003', 'b-0002', 'g-0007']);
  });
});
