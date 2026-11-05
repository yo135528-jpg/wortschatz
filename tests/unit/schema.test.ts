import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildHeadword, headwordToString } from '../../src/domain/format';
import { createNoteId, slugify } from '../../src/domain/id';
import { parseNotes } from '../../src/domain/schema';

const readJson = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
// Real content: only checked for validity, since it changes as words are added or removed.
const content = readJson('../../src/data/cards.json');
// Stable fixture notes for behaviour tests, independent of the real content.
const seed = readJson('../fixtures/notes.json');

describe('cards.json', () => {
  it('is valid against the schema', () => {
    expect(() => parseNotes(content)).not.toThrow();
    expect(() => parseNotes(seed)).not.toThrow();
  });

  it('rejects duplicate ids', () => {
    expect(() => parseNotes([seed[0], seed[0]])).toThrow(/duplicate id/);
  });

  it('rejects a noun without gender', () => {
    const broken = { ...seed[0], noun: { plural: '-en' } };
    expect(() => parseNotes([broken])).toThrow(/noun\.gender/);
  });

  it('rejects a noun cloze that reveals the article', () => {
    const leaky = { ...seed[0], cloze: 'Die [Entscheidung] fiel uns schwer.' };
    expect(() => parseNotes([leaky])).toThrow(/reveals the article/);
  });

  it('rejects the old "___" gap syntax', () => {
    const old = { ...seed[0], cloze: '___ ___ fiel uns schwer.' };
    expect(() => parseNotes([old])).toThrow(/[answer]/);
  });

  it('rejects an unbalanced bracket in the cloze', () => {
    const broken = { ...seed[0], cloze: '[Die] [Entscheidung fiel uns schwer.' };
    expect(() => parseNotes([broken])).toThrow(/unbalanced/);
  });

  it('requires a Turkish translation for the cloze', () => {
    const { clozeTr: _clozeTr, ...withoutTranslation } = seed[0];
    expect(() => parseNotes([withoutTranslation])).toThrow(/clozeTr/);
  });

  it('requires a cloze for tr2de cards', () => {
    const { cloze: _cloze, ...withoutCloze } = seed[0];
    expect(() => parseNotes([withoutCloze])).toThrow(/cloze/);
  });
});

describe('headword formatting', () => {
  const notes = parseNotes(seed);
  const byId = (id: string) => headwordToString(buildHeadword(notes.find((n) => n.id === id)!));

  it('formats nouns, reflexive verbs, separable verbs and adjectives', () => {
    expect(byId('entscheidung-86e2')).toBe('die Entscheidung, -en für + Akk');
    expect(byId('entscheiden-bb52')).toBe('sich entscheiden für + Akk');
    expect(byId('teilnehmen-2109')).toBe('teil|nehmen an + Dat');
    expect(byId('stolz-3362')).toBe('stolz auf + Akk');
  });

  it('shows verb forms with the right auxiliary', () => {
    const verb = notes.find((n) => n.id === 'teilnehmen-2109')!;
    expect(buildHeadword(verb).forms).toBe('nahm teil · hat teilgenommen');
  });
});

describe('ids', () => {
  it('slugifies umlauts and ß', () => {
    expect(slugify('Größe überprüfen')).toBe('groesse-ueberpruefen');
  });

  it('distinguishes homonyms by gender', () => {
    expect(createNoteId('See', 'noun', 'der')).not.toBe(createNoteId('See', 'noun', 'die'));
  });
});
