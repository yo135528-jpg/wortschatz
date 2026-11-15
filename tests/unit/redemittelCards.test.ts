import { describe, expect, it } from 'vitest';
import { REDEMITTEL } from '../../src/data/redemittel';
import { clozeAnswers } from '../../src/domain/cloze';
import { parseRedemittel } from '../../src/domain/redemittel';
import { isRedemittelKey, redemittelKey, redemittelNote, redemittelNotes } from '../../src/domain/redemittelCards';
import { parseNotes } from '../../src/domain/schema';

const groups = parseRedemittel(REDEMITTEL);

describe('Redemittel cards', () => {
  it('turns every phrase into a valid note with a stable id', () => {
    const notes = groups.flatMap((group) => group.items.map((item) => redemittelNote(group, item, '2026-11-16')));
    // The full notes-file schema (cloze rules, duplicate ids) must accept them.
    expect(() => parseNotes(notes)).not.toThrow();
    const group = groups[0]!;
    const item = group.items[0]!;
    expect(redemittelNote(group, item, '2026-11-16').id).toBe(redemittelNote(group, item, '2027-01-01').id);
  });

  it('asks for the whole phrase and keeps the placeholder visible', () => {
    const group = groups.find((g) => g.id === 'meinung-aeussern')!;
    const item = group.items.find((i) => i.de === 'Ich halte … für …')!;
    const note = redemittelNote(group, item, '2026-11-16');
    expect(note.cloze).toBe('[Ich] [halte] … [für] …');
    expect(clozeAnswers(note.cloze!)).toEqual(['Ich', 'halte', 'für']);
    expect(note.meaningTr).toBe(item.tr);
  });

  it('rebuilds only the stored phrases and ignores street keys', () => {
    const group = groups[1]!;
    const item = group.items[1]!;
    const key = redemittelKey(group, item);
    expect(isRedemittelKey(key)).toBe(true);
    expect(isRedemittelKey('geld|Ich bin pleite.')).toBe(false);
    const notes = redemittelNotes(groups, [key, 'geld|Ich bin pleite.', 'kalip:gone|Weg'], '2026-11-16');
    expect(notes).toHaveLength(1);
    expect(notes[0]!.lemma).toBe(item.de);
  });
});
