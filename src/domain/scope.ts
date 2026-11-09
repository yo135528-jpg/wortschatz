import type { Note } from './schema';

/**
 * Study scope: all words, one chapter, or one book page.
 * Encoded as a string so it can live in settings / localStorage:
 *   ""                        → everything
 *   "c:Kapitel 2"             → a chapter
 *   "p:Kapitel 2 · S. 26"     → a single page
 */
export type Scope = string;
export const ALL_SCOPE: Scope = '';

/** "Kursbuch, Kapitel 1, S. 16" → "Kapitel 1 · S. 16". */
export function pageOf(source: string): string {
  return source.replace(/^Kursbuch,\s*/, '').replace(/,\s*/g, ' · ');
}

/** "Kursbuch, Kapitel 1, S. 16" → "Kapitel 1"; other sources → their first part ("Alltagssprache"). */
export function chapterOf(source: string): string {
  const book = /^Kursbuch,\s*(Kapitel\s*\d+)/.exec(source);
  if (book) return book[1]!;
  return source.split(/[,(]/)[0]!.trim();
}

export function inScope(note: Note, scope: Scope): boolean {
  if (!scope) return true;
  if (scope.startsWith('c:')) return chapterOf(note.source) === scope.slice(2);
  if (scope.startsWith('p:')) return pageOf(note.source) === scope.slice(2);
  return true;
}

/** Chapters and pages in book order (order of first appearance in cards.json). */
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
