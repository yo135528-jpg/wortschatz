import { clozeSolved } from './cloze';
import { buildHeadword } from './format';
import type { Note } from './schema';

/** Every German text the UI can read aloud for a note (headword, examples, solved cloze). */
export function speechTexts(note: Note): string[] {
  const texts = [buildHeadword(note).speech, ...note.examples.map((e) => e.de)];
  if (note.cloze) texts.push(clozeSolved(note.cloze));
  return [...new Set(texts.map(normalizeSpeech))];
}

/** Whitespace-normalized text, so the UI and the generator compute the same audio id. */
export function normalizeSpeech(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Stable file name for a clip: FNV-1a 32-bit of the normalized text, 8 hex chars. */
export function audioId(text: string): string {
  const normalized = normalizeSpeech(text);
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
