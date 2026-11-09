import { z } from 'zod';

/**
 * Register of a spoken phrase: who you can say it to.
 * Order = display order of the filter chips.
 */
export const REGISTER_LABELS = {
  alltag: 'Gündelik',
  locker: 'Samimi',
  jugend: 'Gençlik dili',
  regional: 'Bölgesel',
  derb: 'Kaba',
} as const;
export type Register = keyof typeof REGISTER_LABELS;
export const REGISTERS = Object.keys(REGISTER_LABELS) as Register[];

/** One-line Turkish explanation of each register, shown in the legend. */
export const REGISTER_HINTS: Record<Register, string> = {
  alltag: 'Herkesle kullanılır: kasada, komşuyla, işte.',
  locker: 'Arkadaş, aile, iş arkadaşı. Resmî ortamda ve yabancıya karşı kaçın.',
  jugend: 'Gençler arasında. Yetişkin ağzından genelde komik ya da zorlama durur.',
  regional: 'Sadece belli bölgelerde. Bölge kutucukta yazar.',
  derb: 'Kaba veya küfür. Anlaman için var, kullanırken çok dikkat.',
};

const text = z.string().min(1);

export const StreetPhraseSchema = z.object({
  /** The phrase as people actually say it. Supports **bold** markers. */
  de: text,
  /** Natural Turkish meaning (not a word-for-word calque). */
  tr: text,
  register: z.enum(REGISTERS as [Register, ...Register[]]),
  /** Neutral / written equivalent, e.g. "Hast du …?" for "Haste …?". */
  standard: text.optional(),
  /** Where it is used, for regional phrases ("Bayern, Österreich"). */
  region: text.optional(),
  /** One short usage sentence or mini exchange. */
  example: z.object({ de: text, tr: text }).optional(),
  /** Short Turkish note: when to use, nuance, trap. */
  note: text.optional(),
});

export const StreetBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), text }),
  z.object({ type: z.literal('tip'), text }),
  z.object({ type: z.literal('warning'), text }),
  /** A group of phrases under an optional heading. */
  z.object({ type: z.literal('phrases'), heading: text.optional(), items: z.array(StreetPhraseSchema).min(1) }),
  /** A realistic short scene. */
  z.object({
    type: z.literal('dialogue'),
    title: text,
    lines: z.array(z.object({ speaker: text, de: text, tr: text })).min(2),
  }),
  z.object({
    type: z.literal('table'),
    caption: text.optional(),
    head: z.array(z.string()).min(1),
    rows: z.array(z.array(z.string())).min(1),
  }),
]);

export const StreetTopicSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id must be kebab-case'),
  icon: text,
  titleTr: text,
  titleDe: text,
  /** One or two Turkish sentences: what this situation/topic is about. */
  intro: text,
  blocks: z.array(StreetBlockSchema).min(1),
  related: z.array(z.string()).default([]),
});

export const StreetFileSchema = z.array(StreetTopicSchema).superRefine((topics, ctx) => {
  const ids = new Set(topics.map((topic) => topic.id));
  const seen = new Set<string>();
  topics.forEach((topic, index) => {
    if (seen.has(topic.id)) ctx.addIssue({ code: 'custom', path: [index, 'id'], message: `duplicate id "${topic.id}"` });
    seen.add(topic.id);
    topic.related.forEach((id) => {
      if (!ids.has(id)) ctx.addIssue({ code: 'custom', path: [index, 'related'], message: `unknown related id "${id}"` });
    });
    if (!topic.blocks.some((block) => block.type === 'phrases')) {
      ctx.addIssue({ code: 'custom', path: [index, 'blocks'], message: 'topic has no phrases block' });
    }
    topic.blocks.forEach((block, b) => {
      if (block.type === 'table') {
        block.rows.forEach((row, r) => {
          if (row.length !== block.head.length) {
            ctx.addIssue({
              code: 'custom',
              path: [index, 'blocks', b, 'rows', r],
              message: `row has ${row.length} cells, head has ${block.head.length}`,
            });
          }
        });
      }
      if (block.type === 'phrases') {
        block.items.forEach((item, i) => {
          if (item.register === 'regional' && !item.region) {
            ctx.addIssue({ code: 'custom', path: [index, 'blocks', b, 'items', i, 'region'], message: 'regional phrase needs a region' });
          }
        });
      }
    });
  });
});

export type StreetPhrase = z.infer<typeof StreetPhraseSchema>;
export type StreetBlock = z.infer<typeof StreetBlockSchema>;
export type StreetTopic = z.infer<typeof StreetTopicSchema>;
export type StreetTopicInput = z.input<typeof StreetTopicSchema>;

/** Parses and validates the street-German topics; throws a readable error on failure. */
export function parseStreet(raw: unknown): StreetTopic[] {
  const result = StreetFileSchema.safeParse(raw);
  if (!result.success) {
    const lines = result.error.issues.map((issue) => `  [${issue.path.join('.')}] ${issue.message}`);
    throw new Error(`street topics are invalid:\n${lines.join('\n')}`);
  }
  return result.data;
}

export function topicPhrases(topic: StreetTopic): StreetPhrase[] {
  return topic.blocks.flatMap((block) => (block.type === 'phrases' ? block.items : []));
}

export type RegisterFilter = Register | 'all';

export interface PhraseHit {
  topic: StreetTopic;
  phrase: StreetPhrase;
}

/**
 * Case-folds for search across German and Turkish: Turkish dotless ı and dotted İ fold to plain i,
 * so "PARASIZ", "parasız" and "parasiz" all match.
 */
const normalize = (value: string) =>
  value.replaceAll('**', '').replaceAll('İ', 'i').toLocaleLowerCase('de').replaceAll('ı', 'i');

/**
 * Phrase-level search: matches German, Turkish, standard form and example.
 * Returns phrases (not topics) so a search answers "how do people say X?" directly.
 */
export function searchPhrases(
  topics: StreetTopic[],
  filter: { register: RegisterFilter; query: string },
): PhraseHit[] {
  const query = normalize(filter.query.trim());
  return topics.flatMap((topic) =>
    topicPhrases(topic)
      .filter((phrase) => filter.register === 'all' || phrase.register === filter.register)
      .filter((phrase) => {
        if (!query) return true;
        const haystack = [phrase.de, phrase.tr, phrase.standard, phrase.region, phrase.example?.de, phrase.example?.tr]
          .filter(Boolean)
          .join(' ');
        return normalize(haystack).includes(query);
      })
      .map((phrase) => ({ topic, phrase })),
  );
}

/** Number of phrases per register in one topic, for the list badges. */
export function registerCounts(topic: StreetTopic): Partial<Record<Register, number>> {
  const counts: Partial<Record<Register, number>> = {};
  for (const phrase of topicPhrases(topic)) counts[phrase.register] = (counts[phrase.register] ?? 0) + 1;
  return counts;
}
