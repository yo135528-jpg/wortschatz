import type { Note, NoteType } from '../domain/schema';
import { State } from '../scheduling/fsrs';
import type { CardState } from '../storage/types';

/** Learning status of a note, derived from the FSRS state of its cards. */
export type NoteStatus = 'new' | 'learning' | 'mature' | 'suspended';
export type StatusFilter = 'all' | NoteStatus | 'hard';
export type TypeFilter = 'all' | NoteType;
export type SortOrder = 'book' | 'alpha' | 'newest' | 'hardest';

/** Stability (days) from which a card counts as "mature" (same threshold Anki uses for intervals). */
export const MATURE_STABILITY_DAYS = 21;
/** Total lapses (forgotten after being learned) from which a note counts as "hard". */
export const HARD_LAPSES = 2;

export interface NoteRow {
  note: Note;
  status: NoteStatus;
  lapses: number;
  /** Position in cards.json, i.e. book order. */
  index: number;
}

export function noteStatus(states: CardState[]): NoteStatus {
  const active = states.filter((s) => !s.suspended);
  if (!active.length) return states.length ? 'suspended' : 'new';
  if (active.every((s) => s.fsrs.state === State.New)) return 'new';
  const mature = active.every((s) => s.fsrs.state === State.Review && s.fsrs.stability >= MATURE_STABILITY_DAYS);
  return mature ? 'mature' : 'learning';
}

export function buildRows(notes: Note[], states: CardState[]): NoteRow[] {
  const byNote = new Map<string, CardState[]>();
  for (const state of states) {
    const list = byNote.get(state.noteId) ?? [];
    list.push(state);
    byNote.set(state.noteId, list);
  }
  return notes.map((note, index) => {
    const own = byNote.get(note.id) ?? [];
    return { note, index, status: noteStatus(own), lapses: own.reduce((sum, s) => sum + s.fsrs.lapses, 0) };
  });
}

export function matchesQuery(note: Note, query: string): boolean {
  if (!query) return true;
  const haystack = [note.lemma, note.meaningTr, note.source, ...note.tags, ...note.examples.map((e) => e.de)]
    .join(' ')
    .toLocaleLowerCase('de');
  return haystack.includes(query);
}

export interface Filters {
  query: string;
  type: TypeFilter;
  status: StatusFilter;
}

export function filterRows(rows: NoteRow[], filters: Filters): NoteRow[] {
  return rows.filter(
    (row) =>
      matchesQuery(row.note, filters.query) &&
      (filters.type === 'all' || row.note.type === filters.type) &&
      (filters.status === 'all' ||
        (filters.status === 'hard' ? row.lapses >= HARD_LAPSES : row.status === filters.status)),
  );
}

export function sortRows(rows: NoteRow[], order: SortOrder): NoteRow[] {
  const sorted = [...rows];
  switch (order) {
    case 'alpha':
      return sorted.sort((a, b) => a.note.lemma.localeCompare(b.note.lemma, 'de'));
    case 'newest':
      // Same day: later in the file was added later.
      return sorted.sort((a, b) => b.note.createdAt.localeCompare(a.note.createdAt) || b.index - a.index);
    case 'hardest':
      return sorted.sort((a, b) => b.lapses - a.lapses || a.index - b.index);
    default:
      return sorted.sort((a, b) => a.index - b.index);
  }
}

/** "Kursbuch, Kapitel 1, S. 16" → "Kapitel 1 · S. 16". */
export function groupLabel(source: string): string {
  return source.replace(/^Kursbuch,\s*/, '').replace(/,\s*/g, ' · ');
}

export interface Group {
  label: string;
  rows: NoteRow[];
}

/** Groups rows by source, keeping the order in which each source first appears. */
export function groupBySource(rows: NoteRow[]): Group[] {
  const groups = new Map<string, NoteRow[]>();
  for (const row of rows) {
    const label = groupLabel(row.note.source);
    groups.set(label, [...(groups.get(label) ?? []), row]);
  }
  return [...groups].map(([label, list]) => ({ label, rows: list }));
}

export interface Summary {
  notes: number;
  cards: number;
  byStatus: Record<NoteStatus, number>;
  hard: number;
}

export function summarize(rows: NoteRow[]): Summary {
  const byStatus: Record<NoteStatus, number> = { new: 0, learning: 0, mature: 0, suspended: 0 };
  for (const row of rows) byStatus[row.status]++;
  return {
    notes: rows.length,
    cards: rows.reduce((sum, row) => sum + row.note.directions.length, 0),
    byStatus,
    hard: rows.filter((row) => row.lapses >= HARD_LAPSES).length,
  };
}
