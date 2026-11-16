import type { Note } from './schema';

/**
 * Study scope: all words, one chapter, or one book page.
 * Encoded as a string so it can live in settings / localStorage:
 *   ""                          → everything
 *   "c:Kapitel 2"               → a chapter (Kursbuch and Arbeitsbuch pages of that chapter)
 *   "p:Kapitel 2 · S. 26"       → a single Kursbuch page
 *   "p:Kapitel 2 · AB S. 31"    → a single Arbeitsbuch page
 */
export type Scope = string;
export const ALL_SCOPE: Scope = '';

/** "Kursbuch, Kapitel 1, S. 16" or "Arbeitsbuch, Kapitel 1, S. 10". */
const BOOK_SOURCE = /^(Kursbuch|Arbeitsbuch),\s*(Kapitel\s*(\d+))(?:,\s*S\.\s*(\d+))?/;

/** Page labels as they were before the Arbeitsbuch got its own format; stored scopes may still use them. */
function legacyPageOf(source: string): string {
  return source.replace(/^Kursbuch,\s*/, '').replace(/,\s*/g, ' · ');
}

/** "Kursbuch, Kapitel 1, S. 16" → "Kapitel 1 · S. 16"; "Arbeitsbuch, Kapitel 1, S. 10" → "Kapitel 1 · AB S. 10". */
export function pageOf(source: string): string {
  const book = BOOK_SOURCE.exec(source);
  if (!book || book[1] === 'Kursbuch') return legacyPageOf(source);
  return book[4] ? `${book[2]} · AB S. ${book[4]}` : `${book[2]} · AB`;
}

/** Kursbuch and Arbeitsbuch pages share their chapter ("Kapitel 1"); other sources → their first part ("Alltagssprache"). */
export function chapterOf(source: string): string {
  const book = BOOK_SOURCE.exec(source);
  if (book) return book[2]!;
  return source.split(/[,(]/)[0]!.trim();
}

export function inScope(note: Note, scope: Scope): boolean {
  if (!scope) return true;
  const wanted = scope.slice(2);
  if (scope.startsWith('c:')) {
    // Before chapters covered both books, the whole Arbeitsbuch was one "chapter".
    if (wanted === 'Arbeitsbuch') return note.source.startsWith('Arbeitsbuch');
    return chapterOf(note.source) === wanted;
  }
  if (scope.startsWith('p:')) return pageOf(note.source) === wanted || legacyPageOf(note.source) === wanted;
  return true;
}

/** Sort key in study order: chapter, then Kursbuch → Arbeitsbuch → extras of that chapter, then page. */
function bookOrder(source: string): [number, number, number] {
  const book = BOOK_SOURCE.exec(source);
  if (book) return [Number(book[3]), book[1] === 'Kursbuch' ? 0 : 1, Number(book[4] ?? 0)];
  const chapter = /Kapitel\s*(\d+)/.exec(source);
  return [chapter ? Number(chapter[1]) : Number.MAX_SAFE_INTEGER, 2, 0];
}

/**
 * Notes in the order the learner works through the book: per chapter first the Kursbuch,
 * then the Arbeitsbuch. Notes of one page keep their order from cards.json (stable sort).
 * New cards, the word list and the chapter lists all follow this order.
 */
export function sortByBook<T extends Pick<Note, 'source'>>(notes: readonly T[]): T[] {
  return notes
    .map((note, index) => ({ note, index, key: bookOrder(note.source) }))
    .sort((a, b) => a.key[0] - b.key[0] || a.key[1] - b.key[1] || a.key[2] - b.key[2] || a.index - b.index)
    .map((entry) => entry.note);
}

/** Chapters and pages in the order of the given notes. */
export function scopeOptions(notes: Iterable<Note>): { chapters: string[]; pages: string[] } {
  const chapters = new Set<string>();
  const pages = new Set<string>();
  for (const note of notes) {
    chapters.add(chapterOf(note.source));
    pages.add(pageOf(note.source));
  }
  return { chapters: [...chapters], pages: [...pages] };
}

export function scopeLabel(scope: Scope): string {
  if (!scope) return 'Tüm kelimeler';
  return scope.slice(2);
}
