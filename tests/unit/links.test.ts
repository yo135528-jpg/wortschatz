import { describe, expect, it } from 'vitest';
import { GRAMMAR_TOPICS } from '../../src/data/grammar';
import { grammarTopicsFor, LINKED_TOPIC_IDS, notesForTopic } from '../../src/domain/links';
import { NoteSchema } from '../../src/domain/schema';
import { makeNote } from './helpers';

const verb = NoteSchema.parse({
  id: 'sich-anmelden-0001',
  type: 'verb',
  lemma: 'anmelden',
  verb: { reflexive: 'Akk', separablePrefix: 'an', praeteritum: 'meldete an', partizip2: 'angemeldet', auxiliary: 'haben' },
  rektion: [{ preposition: 'für', case: 'Akk' }],
  meaningTr: 'kaydolmak',
  hintTr: 'fiil',
  cloze: 'Ich [melde] mich [an].',
  clozeTr: 'Kaydoluyorum.',
  examples: [{ de: 'Ich melde mich an.', fromBook: false }],
  source: 'test',
  createdAt: '2026-11-09',
});

describe('grammar links', () => {
  it('every linked topic id exists in the grammar reference', () => {
    const ids = new Set(GRAMMAR_TOPICS.map((topic) => topic.id));
    expect(LINKED_TOPIC_IDS.filter((id) => !ids.has(id))).toEqual([]);
  });

  it('derives topics from verb structure', () => {
    expect(grammarTopicsFor(verb)).toEqual(['reflexive-verben', 'trennbare-verben', 'verben-mit-praepositionen']);
  });

  it('derives topics from grammar text and connectors', () => {
    const noun = makeNote({ id: 'kollege-0002', grammarTr: 'n-Deklination: den Kollegen.' });
    const obwohl = makeNote({ id: 'obwohl-0003', type: 'other', lemma: 'obwohl' } as never);
    expect(grammarTopicsFor(noun)).toContain('n-deklination');
    expect(grammarTopicsFor(obwohl)).toEqual(['konnektoren-b2']);
    expect(notesForTopic([verb, noun], 'n-deklination')).toEqual([noun]);
  });
});
