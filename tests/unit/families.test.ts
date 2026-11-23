import { describe, expect, it } from 'vitest';
import { familyQuestions } from '../../src/domain/drills';
import { buildFamilies, familyOf, memberLabel, PREFIX_MEANINGS, splitVerb } from '../../src/domain/families';
import { NoteSchema, type Note, type VerbNote } from '../../src/domain/schema';

function verb(lemma: string, separablePrefix: string | null, partizip2: string, meaningTr = lemma): VerbNote {
  return NoteSchema.parse({
    id: `${lemma}-0001`,
    type: 'verb',
    lemma,
    verb: { reflexive: null, separablePrefix, praeteritum: 'x', partizip2, auxiliary: 'haben' },
    meaningTr,
    hintTr: 'fiil',
    examples: [{ de: `${lemma}.`, fromBook: false }],
    source: 'test',
    createdAt: '2026-11-23',
  }) as VerbNote;
}

const bauen = verb('bauen', null, 'gebaut', 'inşa etmek');
const abbauen = verb('abbauen', 'ab', 'abgebaut', 'azaltmak');
const aufbauen = verb('aufbauen', 'auf', 'aufgebaut', 'kurmak');
const verbauen = verb('verbauen', null, 'verbaut', 'kapatmak');
const beten = verb('beten', null, 'gebetet');
const ten = verb('ten', null, 'getet');
const studieren = verb('verstudieren', null, 'verstudiert');

describe('splitVerb', () => {
  it('uses the separable prefix from the note', () => {
    expect(splitVerb(abbauen)).toEqual({ prefix: 'ab', stem: 'bauen', separable: true });
  });

  it('detects inseparable prefixes by the participle without ge-', () => {
    expect(splitVerb(verbauen)).toEqual({ prefix: 'ver', stem: 'bauen', separable: false });
  });

  it('does not split verbs that only look prefixed', () => {
    expect(splitVerb(beten)).toBeNull();
    expect(splitVerb(studieren)).toBeNull();
    expect(splitVerb(bauen)).toBeNull();
  });
});

describe('buildFamilies', () => {
  const families = buildFamilies([abbauen, aufbauen, bauen, verbauen, beten, ten]);

  it('groups verbs by stem, stem verb first', () => {
    expect([...families.keys()]).toEqual(['bauen']);
    expect(families.get('bauen')!.members.map((m) => m.note.lemma)).toEqual(['bauen', 'abbauen', 'aufbauen', 'verbauen']);
  });

  it('needs at least two members', () => {
    expect(buildFamilies([abbauen]).size).toBe(0);
  });

  it('finds the family of a note', () => {
    expect(familyOf(families, aufbauen)?.stem).toBe('bauen');
    expect(familyOf(families, bauen)?.stem).toBe('bauen');
    expect(familyOf(families, beten)).toBeNull();
  });

  it('writes separable verbs with a middle dot', () => {
    const members = families.get('bauen')!.members;
    expect(members.map(memberLabel)).toEqual(['bauen', 'ab·bauen', 'auf·bauen', 'verbauen']);
  });

  it('has a meaning for the common prefixes', () => {
    for (const prefix of ['ab', 'auf', 'aus', 'ein', 'um', 'ver', 'be', 'ent', 'er', 'zer']) expect(PREFIX_MEANINGS[prefix]).toBeTruthy();
  });
});

describe('familyQuestions', () => {
  const notes: Note[] = [bauen, abbauen, aufbauen, verbauen, beten];
  const families = buildFamilies(notes);

  it('asks only for verbs with a family, options from the same family', () => {
    const questions = familyQuestions(notes, families, () => 0.5);
    expect(questions.map((q) => q.id)).toEqual(['bauen-0001', 'abbauen-0001', 'aufbauen-0001', 'verbauen-0001']);
    const question = questions.find((q) => q.id === 'abbauen-0001')!;
    const field = question.fields[0]!;
    expect(field.kind).toBe('choice');
    if (field.kind !== 'choice') return;
    expect(field.answer).toBe('ab·bauen');
    expect(new Set(field.options)).toEqual(new Set(['bauen', 'ab·bauen', 'auf·bauen', 'verbauen']));
    expect(question.title).toBe('azaltmak');
    expect(question.explain).toContain('ab-');
  });
});
