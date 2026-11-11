import { z } from 'zod';

/**
 * Redemittel ("Kalıplar"): ready-made phrases for speaking and writing at B2,
 * grouped by what the learner wants to DO (give an opinion, compare, guess …).
 */
const text = z.string().min(1);

export const SKILL_LABELS = {
  sprechen: 'Konuşma',
  schreiben: 'Yazma',
  beide: 'Konuşma + Yazma',
} as const;
export type RedemittelSkill = keyof typeof SKILL_LABELS;

export const RedemittelItemSchema = z.object({
  /** The phrase; "…" marks where the learner's own content goes. */
  de: text,
  /** What it says, in natural Turkish. */
  tr: text,
  /** One complete sentence that uses the phrase. */
  example: z.object({ de: text, tr: text }),
  /** Short Turkish note: word order, register, trap. */
  note: text.optional(),
});

export const RedemittelGroupSchema = z.object({
  /** kebab-case, stable: used in URLs and practice stats. */
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  icon: text,
  titleDe: text,
  titleTr: text,
  /** When to use this group, one Turkish sentence. */
  summaryTr: text,
  skill: z.enum(['sprechen', 'schreiben', 'beide']),
  items: z.array(RedemittelItemSchema).min(3),
});

export type RedemittelItem = z.infer<typeof RedemittelItemSchema>;
export type RedemittelGroup = z.infer<typeof RedemittelGroupSchema>;
export type RedemittelGroupInput = z.input<typeof RedemittelGroupSchema>;

export function parseRedemittel(input: unknown): RedemittelGroup[] {
  const groups = z.array(RedemittelGroupSchema).parse(input);
  const ids = new Set<string>();
  const phrases = new Set<string>();
  for (const group of groups) {
    if (ids.has(group.id)) throw new Error(`Duplicate Redemittel group id: ${group.id}`);
    ids.add(group.id);
    for (const item of group.items) {
      // The quiz asks "which phrase means …": the same phrase in two groups would have two right answers.
      if (phrases.has(item.de)) throw new Error(`Duplicate Redemittel phrase: ${item.de}`);
      phrases.add(item.de);
    }
  }
  return groups;
}

/** Case-insensitive search over phrases, meanings and examples. */
export function searchRedemittel(groups: RedemittelGroup[], query: string): { group: RedemittelGroup; item: RedemittelItem }[] {
  const needle = query.trim().toLocaleLowerCase('tr');
  if (!needle) return [];
  const has = (value: string) => value.toLocaleLowerCase('tr').includes(needle) || value.toLowerCase().includes(needle);
  return groups.flatMap((group) =>
    group.items
      .filter((item) => has(item.de) || has(item.tr) || has(item.example.de))
      .map((item) => ({ group, item })),
  );
}
