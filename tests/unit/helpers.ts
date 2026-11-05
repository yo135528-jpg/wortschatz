import { NoteSchema, type Note } from '../../src/domain/schema';

/** Builds a valid expression note with sensible defaults; override what the test cares about. */
export function makeNote(overrides: Partial<Note> & { id: string }): Note {
  return NoteSchema.parse({
    type: 'expression',
    lemma: overrides.id,
    meaningTr: 'anlam',
    hintTr: 'kalıp',
    cloze: 'Ein ___ Satz.',
    examples: [{ de: 'Ein Satz.', fromBook: false }],
    source: 'test',
    createdAt: '2026-11-05',
    ...overrides,
  });
}
