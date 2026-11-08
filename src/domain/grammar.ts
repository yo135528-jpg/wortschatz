import { z } from 'zod';

/** CEFR levels covered by the grammar reference. */
export const LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
export type Level = (typeof LEVELS)[number];

/** Topic categories with their Turkish labels, in display order. */
export const CATEGORY_LABELS = {
  verb: 'Fiiller ve zamanlar',
  noun: 'İsim ve artikel',
  pronoun: 'Zamirler',
  adjective: 'Sıfatlar',
  preposition: 'Edatlar',
  sentence: 'Cümle yapısı',
  connector: 'Bağlaçlar ve yan cümleler',
  passive: 'Passiv',
  mood: 'Konjunktiv',
  wordformation: 'Kelime türetme',
} as const;
export type Category = keyof typeof CATEGORY_LABELS;

const text = z.string().min(1);

export const GrammarBlockSchema = z.discriminatedUnion('type', [
  /** Explanation paragraph (Turkish). Supports **bold** markers. */
  z.object({ type: z.literal('text'), text }),
  /** Conjugation/declension table; every row must have as many cells as the head. */
  z.object({ type: z.literal('table'), caption: text.optional(), head: z.array(z.string()).min(1), rows: z.array(z.array(z.string())).min(1) }),
  /** German example sentences with natural Turkish translations. */
  z.object({ type: z.literal('examples'), items: z.array(z.object({ de: text, tr: text })).min(1) }),
  /** Memory aid or useful shortcut. */
  z.object({ type: z.literal('tip'), text }),
  /** Typical mistake for Turkish speakers. */
  z.object({ type: z.literal('warning'), text }),
]);

export const GrammarTopicSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id must be kebab-case'),
  level: z.enum(LEVELS),
  category: z.enum(Object.keys(CATEGORY_LABELS) as [Category, ...Category[]]),
  titleDe: text,
  titleTr: text,
  /** One or two sentences: what the structure is for. */
  summary: text,
  blocks: z.array(GrammarBlockSchema).min(1),
  /** Ids of related topics, shown as links. */
  related: z.array(z.string()).default([]),
  /** Where the user's textbook teaches it, e.g. "Sicher! B2.1, Kapitel 1". */
  book: text.optional(),
});

export const GrammarFileSchema = z.array(GrammarTopicSchema).superRefine((topics, ctx) => {
  const ids = new Set<string>();
  topics.forEach((topic, index) => {
    if (ids.has(topic.id)) ctx.addIssue({ code: 'custom', path: [index, 'id'], message: `duplicate id "${topic.id}"` });
    ids.add(topic.id);
  });
  topics.forEach((topic, index) => {
    topic.related.forEach((id) => {
      if (!ids.has(id)) ctx.addIssue({ code: 'custom', path: [index, 'related'], message: `unknown related id "${id}"` });
    });
    topic.blocks.forEach((block, b) => {
      if (block.type !== 'table') return;
      block.rows.forEach((row, r) => {
        if (row.length !== block.head.length) {
          ctx.addIssue({
            code: 'custom',
            path: [index, 'blocks', b, 'rows', r],
            message: `row has ${row.length} cells, head has ${block.head.length}`,
          });
        }
      });
    });
  });
});

export type GrammarBlock = z.infer<typeof GrammarBlockSchema>;
export type GrammarTopic = z.infer<typeof GrammarTopicSchema>;
export type GrammarTopicInput = z.input<typeof GrammarTopicSchema>;

/** Parses and validates the grammar topics; throws a readable error on failure. */
export function parseGrammar(raw: unknown): GrammarTopic[] {
  const result = GrammarFileSchema.safeParse(raw);
  if (!result.success) {
    const lines = result.error.issues.map((issue) => `  [${issue.path.join('.')}] ${issue.message}`);
    throw new Error(`grammar topics are invalid:\n${lines.join('\n')}`);
  }
  return result.data;
}

export type LevelFilter = Level | 'all';

/** Case-insensitive search over titles, summary and example sentences. */
export function filterTopics(topics: GrammarTopic[], filter: { level: LevelFilter; query: string }): GrammarTopic[] {
  const query = filter.query.trim().toLocaleLowerCase('de');
  return topics.filter((topic) => {
    if (filter.level !== 'all' && topic.level !== filter.level) return false;
    if (!query) return true;
    const haystack = [topic.titleDe, topic.titleTr, topic.summary, ...topic.blocks.flatMap(blockText)]
      .join(' ')
      .toLocaleLowerCase('de');
    return haystack.includes(query);
  });
}

function blockText(block: GrammarBlock): string[] {
  switch (block.type) {
    case 'examples':
      return block.items.map((item) => item.de);
    case 'table':
      return [...block.head, ...block.rows.flat()];
    default:
      return [];
  }
}

/** Groups topics by level, keeping the authored order inside each level. */
export function groupByLevel(topics: GrammarTopic[]): { level: Level; topics: GrammarTopic[] }[] {
  return LEVELS.map((level) => ({ level, topics: topics.filter((topic) => topic.level === level) })).filter(
    (group) => group.topics.length > 0,
  );
}

/** Splits "a **b** c" into segments so the UI can render bold text without HTML parsing. */
export function parseInline(value: string): { text: string; bold: boolean }[] {
  return value
    .split('**')
    .map((part, index) => ({ text: part, bold: index % 2 === 1 }))
    .filter((segment) => segment.text.length > 0);
}
