import type { Note, VerbNote } from './schema';

/**
 * Verb families: verbs that share a stem and differ only by prefix (bauen → aufbauen,
 * abbauen, umbauen). Derived from the notes at runtime, no per-note field. Learners keep
 * the stem but forget the prefixed variants, so they are shown and drilled side by side.
 */

/** What a prefix usually adds. Not every verb follows it, but it is a strong memory hook. */
export const PREFIX_MEANINGS: Record<string, string> = {
  ab: 'azalma, ayrılma, aşağı',
  an: 'bir şeye doğru, başlama',
  auf: 'yukarı, açma, kurma',
  aus: 'dışarı, sonuna kadar',
  bei: 'yanına, katkı',
  ein: 'içeri',
  fest: 'sabit, kesin',
  her: 'buraya doğru',
  hin: 'oraya doğru',
  heraus: 'dışarı çıkarma',
  los: 'başlama, bırakma',
  mit: 'birlikte',
  nach: 'arkasından, tekrar, kontrol',
  vor: 'öne, önceden',
  weg: 'uzağa',
  weiter: 'devam',
  zu: 'kapatma, ekleme, -e doğru',
  zurück: 'geri',
  zusammen: 'bir araya',
  um: 'değiştirme, etrafında',
  über: 'üstünden, aşırı, aktarma',
  unter: 'altına, arasına',
  durch: 'baştan sona, içinden',
  wider: 'karşı',
  wieder: 'yeniden',
  be: 'bir şeye yöneltme (geçişli yapar)',
  ent: 'uzaklaşma, kurtulma',
  er: 'sonuca ulaşma',
  miss: 'yanlış, kötü',
  ver: 'değişim, yanlış, bitirme',
  zer: 'parçalama',
  hinter: 'arkada bırakma',
};

/** Inseparable (and dual) prefixes, longest first so "hinter" wins over "hin". */
const INSEPARABLE = ['hinter', 'wieder', 'wider', 'durch', 'unter', 'über', 'miss', 'zer', 'ver', 'ent', 'emp', 'um', 'er', 'be'];

/** Shortest stem worth grouping; avoids noise like "be|ten". */
const MIN_STEM = 3;

export interface FamilyMember {
  note: VerbNote;
  /** Prefix in front of the stem, "" for the stem verb itself. */
  prefix: string;
  separable: boolean;
}

export interface VerbFamily {
  stem: string;
  members: FamilyMember[];
}

/** Splits a verb into prefix + stem, or null if it has no recognisable prefix. */
export function splitVerb(note: VerbNote): { prefix: string; stem: string; separable: boolean } | null {
  const lemma = note.lemma.toLowerCase();
  const separable = note.verb.separablePrefix?.toLowerCase();
  if (separable && lemma.startsWith(separable)) {
    const stem = lemma.slice(separable.length);
    return stem.length >= MIN_STEM ? { prefix: separable, stem, separable: true } : null;
  }
  // A real inseparable prefix takes no ge- in the participle (besucht vs. gebetet), and -ieren verbs are not prefixed.
  const participle = note.verb.partizip2.toLowerCase();
  if (participle.startsWith('ge') || participle.endsWith('iert')) return null;
  const prefix = INSEPARABLE.find((p) => lemma.startsWith(p) && lemma.length - p.length >= MIN_STEM);
  return prefix ? { prefix, stem: lemma.slice(prefix.length), separable: false } : null;
}

/** All families with at least two members, keyed by stem. Members: stem verb first, then alphabetical. */
export function buildFamilies(notes: Iterable<Note>): Map<string, VerbFamily> {
  const verbs = [...notes].filter((note): note is VerbNote => note.type === 'verb');
  const byStem = new Map<string, FamilyMember[]>();
  const add = (stem: string, member: FamilyMember) => {
    const list = byStem.get(stem) ?? [];
    list.push(member);
    byStem.set(stem, list);
  };
  for (const note of verbs) {
    const parts = splitVerb(note);
    if (parts) add(parts.stem, { note, prefix: parts.prefix, separable: parts.separable });
  }
  // Stem verbs (bauen) join a family only when a prefixed relative exists.
  for (const note of verbs) {
    const stem = note.lemma.toLowerCase();
    if (byStem.has(stem) && !splitVerb(note)) add(stem, { note, prefix: '', separable: false });
  }

  const families = new Map<string, VerbFamily>();
  for (const [stem, members] of byStem) {
    if (members.length < 2) continue;
    members.sort((a, b) => (a.prefix === '' ? -1 : b.prefix === '' ? 1 : a.note.lemma.localeCompare(b.note.lemma, 'de')));
    families.set(stem, { stem, members });
  }
  return families;
}

/** The family a note belongs to, or null. */
export function familyOf(families: Map<string, VerbFamily>, note: Note): VerbFamily | null {
  if (note.type !== 'verb') return null;
  const stem = splitVerb(note)?.stem ?? note.lemma.toLowerCase();
  const family = families.get(stem);
  return family?.members.some((m) => m.note.id === note.id) ? family : null;
}

/** "auf·bauen" for separable, "be|bauen" style is avoided: inseparable verbs are written as one word. */
export function memberLabel(member: FamilyMember): string {
  const lemma = member.note.lemma;
  if (!member.prefix) return lemma;
  return member.separable ? `${lemma.slice(0, member.prefix.length)}·${lemma.slice(member.prefix.length)}` : lemma;
}

/** Cached families for the current note set (recomputed when notes are added/removed). */
let cache: { size: number; source: unknown; families: Map<string, VerbFamily> } | null = null;
export function familiesFor(notes: Map<string, Note>): Map<string, VerbFamily> {
  if (!cache || cache.source !== notes || cache.size !== notes.size) {
    cache = { size: notes.size, source: notes, families: buildFamilies(notes.values()) };
  }
  return cache.families;
}
