/** Turns a German lemma into a URL-safe ASCII slug. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** FNV-1a 32-bit hash, returned as 4 hex chars. Deterministic and dependency-free. */
export function shortHash(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return ((hash >>> 0) & 0xffff).toString(16).padStart(4, '0');
}

/**
 * Builds a note id such as "entscheidung-3f9a".
 * The gender is part of the hash so "der See" and "die See" get different ids.
 * IMPORTANT: the id is generated once and then frozen; never recompute it for an existing note.
 */
export function createNoteId(lemma: string, type: string, gender?: string): string {
  return `${slugify(lemma)}-${shortHash(`${type}|${lemma}|${gender ?? ''}`)}`;
}
