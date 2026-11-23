import { z } from 'zod';
import { shortHash, slugify } from './id';
import { NoteSchema, type Note } from './schema';

/**
 * Graded reading ("Okuma"): short stories whose words link to the learner's cards.
 * In a sentence, a tappable word is written `[surface|lemma]` (or `[word]` when both are the
 * same). The lemma is looked up in the learner's notes first ("kartlarında var"); otherwise it
 * must be in the story's glossary ("yeni kelime"), from which a card can be added.
 */

export const STORY_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
export type StoryLevel = (typeof STORY_LEVELS)[number];

const text = z.string().min(1);

export const StorySentenceSchema = z.object({ de: text, tr: text });

export const StoryPartSchema = z.object({
  title: text,
  paragraphs: z.array(z.array(StorySentenceSchema).min(1)).min(1),
});

/**
 * A glossary entry is a card without bookkeeping fields: id, source, tags and createdAt are
 * added when the learner adds it, so the content stays short and the id stays stable.
 */
export const GlossaryEntrySchema = z.object({}).passthrough().refine((entry) => typeof entry.lemma === 'string', {
  message: 'glossary entry needs a lemma',
});

export const StorySchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  level: z.enum(STORY_LEVELS),
  title: text,
  titleTr: text,
  summaryTr: text,
  /** Book chapter the vocabulary comes from, e.g. "Kapitel 2". */
  chapter: text.optional(),
  parts: z.array(StoryPartSchema).min(1),
  glossary: z.array(GlossaryEntrySchema).default([]),
});

export type StorySentence = z.infer<typeof StorySentenceSchema>;
export type StoryPart = z.infer<typeof StoryPartSchema>;
export type Story = z.infer<typeof StorySchema>;

export function parseStories(raw: unknown): Story[] {
  return z.array(StorySchema).parse(raw);
}

export type Segment = { kind: 'text'; value: string } | { kind: 'word'; surface: string; lemma: string };

/** Splits a sentence into plain text and tappable words. */
export function segments(sentence: string): Segment[] {
  const parts: Segment[] = [];
  const pattern = /\[([^\]|]+)(?:\|([^\]]+))?\]/g;
  let last = 0;
  for (const match of sentence.matchAll(pattern)) {
    if (match.index > last) parts.push({ kind: 'text', value: sentence.slice(last, match.index) });
    const surface = match[1]!.trim();
    parts.push({ kind: 'word', surface, lemma: (match[2] ?? surface).trim() });
    last = match.index + match[0].length;
  }
  if (last < sentence.length) parts.push({ kind: 'text', value: sentence.slice(last) });
  return parts;
}

/** The sentence as plain text (for speech). */
export function plainSentence(sentence: string): string {
  return segments(sentence)
    .map((part) => (part.kind === 'text' ? part.value : part.surface))
    .join('');
}

/** Every linked lemma of a story, in reading order, without duplicates. */
export function storyLemmas(story: Story): string[] {
  const lemmas = story.parts.flatMap((part) =>
    part.paragraphs.flat().flatMap((sentence) => segments(sentence.de).flatMap((s) => (s.kind === 'word' ? [s.lemma] : []))),
  );
  return [...new Set(lemmas)];
}

export function glossaryEntry(story: Story, lemma: string): Record<string, unknown> | undefined {
  const wanted = lemma.toLowerCase();
  return story.glossary.find((entry) => String(entry.lemma).toLowerCase() === wanted);
}

// ---------- Cards from stories ----------

const PREFIX = 'hikaye:';

/** Settings key of an added story word: "hikaye:<storyId>|<lemma>". */
export function storyKey(story: Story, lemma: string): string {
  return `${PREFIX}${story.id}|${lemma}`;
}

export function isStoryKey(key: string): boolean {
  return key.startsWith(PREFIX);
}

export function storyNote(story: Story, entry: Record<string, unknown>, createdAt: string): Note {
  const lemma = String(entry.lemma);
  const slug = slugify(lemma).slice(0, 40).replace(/-+$/, '') || 'kelime';
  return NoteSchema.parse({
    ...entry,
    id: `story-${slug}-${shortHash(storyKey(story, lemma))}`,
    source: `Okuma, ${story.title}`,
    tags: ['okuma', `okuma-${story.level.toLowerCase()}`],
    createdAt,
  });
}

/** Rebuilds the notes for stored keys; unknown keys (content changed) are skipped. */
export function storyNotes(stories: Story[], keys: readonly string[], createdAt: string): Note[] {
  const wanted = new Set(keys);
  return stories.flatMap((story) =>
    story.glossary
      .filter((entry) => wanted.has(storyKey(story, String(entry.lemma))))
      .map((entry) => storyNote(story, entry, createdAt)),
  );
}
