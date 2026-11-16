import { shortHash, slugify } from './id';
import type { RedemittelGroup, RedemittelItem } from './redemittel';
import { NoteSchema, type Note } from './schema';
import { fullCloze } from './streetCards';

/**
 * Redemittel the learner chose to study become regular notes at runtime, like street phrases.
 * Their keys live in the same settings list (`streetPhrases`) with a "kalip:" prefix, so
 * backups and device sync carry them without a new field.
 */
const PREFIX = 'kalip:';

/** Stable key of a phrase: "kalip:<groupId>|<German text>". */
export function redemittelKey(group: RedemittelGroup, item: RedemittelItem): string {
  return `${PREFIX}${group.id}|${item.de}`;
}

export function isRedemittelKey(key: string): boolean {
  return key.startsWith(PREFIX);
}

export function redemittelNote(group: RedemittelGroup, item: RedemittelItem, createdAt: string): Note {
  const slug = slugify(item.de).slice(0, 40).replace(/-+$/, '') || 'kalip';
  return NoteSchema.parse({
    id: `kalip-${slug}-${shortHash(redemittelKey(group, item))}`,
    type: 'expression',
    lemma: item.de,
    meaningTr: item.tr,
    hintTr: `kalıp · ${group.titleTr}`,
    // The whole phrase is the answer; "…" (the learner's own content) stays visible.
    cloze: fullCloze(item.de),
    clozeTr: item.tr,
    examples: [{ de: item.example.de, tr: item.example.tr, fromBook: false }],
    note: item.note ?? null,
    source: `Kalıplar, ${group.titleTr}`,
    tags: ['redemittel'],
    createdAt,
  });
}

/** Rebuilds the notes for the stored keys; unknown keys (content changed) are skipped. */
export function redemittelNotes(groups: RedemittelGroup[], keys: readonly string[], createdAt: string): Note[] {
  const wanted = new Set(keys);
  return groups.flatMap((group) =>
    group.items.filter((item) => wanted.has(redemittelKey(group, item))).map((item) => redemittelNote(group, item, createdAt)),
  );
}
