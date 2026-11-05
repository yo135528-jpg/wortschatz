import type { Direction, Note } from './schema';

/** A reviewable card = one direction of one note. */
export interface CardRef {
  key: string;
  noteId: string;
  direction: Direction;
}

export function cardKey(noteId: string, direction: Direction): string {
  return `${noteId}:${direction}`;
}

/** Expands notes into the cards they produce, in note order (de2tr before tr2de). */
export function cardsFromNotes(notes: Note[]): CardRef[] {
  const order: Direction[] = ['de2tr', 'tr2de'];
  return notes.flatMap((note) =>
    order
      .filter((direction) => note.directions.includes(direction))
      .map((direction) => ({ key: cardKey(note.id, direction), noteId: note.id, direction })),
  );
}
