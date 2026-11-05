import { z } from 'zod';

/** Grammatical case used in a Rektion (government) entry. */
export const CaseSchema = z.enum(['Akk', 'Dat', 'Gen']);

/**
 * Rektion: which preposition and case a word governs.
 * `preposition: null` means a bare case, e.g. "helfen + Dat".
 */
export const RektionSchema = z.object({
  preposition: z.string().min(1).nullable(),
  case: CaseSchema,
});

export const ExampleSchema = z.object({
  de: z.string().min(1),
  /** Optional Turkish translation, shown on the back in both directions. */
  tr: z.string().min(1).optional(),
  /** True if the sentence is taken from the textbook. */
  fromBook: z.boolean(),
});

export const DirectionSchema = z.enum(['de2tr', 'tr2de']);

const slugIdPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f]{4}$/;

/** Fields shared by every note type. */
const baseNote = {
  id: z.string().regex(slugIdPattern, 'id must look like "slug-1a2b"'),
  lemma: z.string().min(1),
  rektion: z.array(RektionSchema).default([]),
  /** Turkish meaning, the one that fits the book context first. */
  meaningTr: z.string().min(1),
  /** Disambiguation hint for tr2de, e.g. word type. */
  hintTr: z.string().min(1),
  /** German gap sentence for tr2de; "___" marks the gap(s). */
  cloze: z.string().includes('___').optional(),
  examples: z.array(ExampleSchema).min(1).max(3),
  /** Short Turkish grammar explanation (word order, declension ...), only when it helps. */
  grammarTr: z.string().min(1).nullable().default(null),
  /** Register / false friend / confusable note, only when it matters. */
  note: z.string().min(1).nullable().default(null),
  directions: z.array(DirectionSchema).min(1).default(['de2tr', 'tr2de']),
  source: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'createdAt must be YYYY-MM-DD'),
};

export const NounNoteSchema = z.object({
  ...baseNote,
  type: z.literal('noun'),
  noun: z.object({
    gender: z.enum(['der', 'die', 'das']),
    /** Dictionary notation: "-en", "¨-e", "-" (unchanged); null = no plural. */
    plural: z.string().min(1).nullable(),
  }),
});

export const VerbNoteSchema = z.object({
  ...baseNote,
  type: z.literal('verb'),
  verb: z.object({
    /** null = not reflexive; otherwise the case of "sich". */
    reflexive: z.enum(['Akk', 'Dat']).nullable(),
    /** Separable prefix, e.g. "an" for "ankommen"; null if not separable. */
    separablePrefix: z.string().min(1).nullable(),
    praeteritum: z.string().min(1),
    partizip2: z.string().min(1),
    auxiliary: z.enum(['haben', 'sein', 'haben/sein']),
  }),
});

export const AdjectiveNoteSchema = z.object({
  ...baseNote,
  type: z.literal('adjective'),
  adjective: z
    .object({
      /** Only filled in when irregular, e.g. "besser". */
      comparative: z.string().min(1).nullable(),
      superlative: z.string().min(1).nullable(),
    })
    .default({ comparative: null, superlative: null }),
});

export const ExpressionNoteSchema = z.object({
  ...baseNote,
  type: z.literal('expression'),
});

export const OtherNoteSchema = z.object({
  ...baseNote,
  /** Adverbs, conjunctions, particles ... */
  type: z.literal('other'),
});

export const NoteSchema = z.discriminatedUnion('type', [
  NounNoteSchema,
  VerbNoteSchema,
  AdjectiveNoteSchema,
  ExpressionNoteSchema,
  OtherNoteSchema,
]);

export const NotesFileSchema = z.array(NoteSchema).superRefine((notes, ctx) => {
  const seenIds = new Map<string, number>();
  notes.forEach((note, index) => {
    const previous = seenIds.get(note.id);
    if (previous !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'id'],
        message: `duplicate id "${note.id}" (also at index ${previous})`,
      });
    }
    seenIds.set(note.id, index);

    // A gap sentence makes the tr2de answer unambiguous.
    if (note.directions.includes('tr2de') && !note.cloze) {
      ctx.addIssue({ code: 'custom', path: [index, 'cloze'], message: 'tr2de cards need a cloze sentence' });
    }
    // The cloze must not leak the answer.
    if (note.cloze) {
      const cloze = note.cloze.toLowerCase();
      if (!note.lemma.includes(' ') && cloze.includes(note.lemma.toLowerCase())) {
        ctx.addIssue({ code: 'custom', path: [index, 'cloze'], message: 'cloze contains the lemma itself' });
      }
      if (note.type === 'noun' && /\b(der|die|das|den|dem|des)\s+___/.test(cloze)) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'cloze'],
          message: 'noun cloze reveals the article; gap the article too ("___ ___")',
        });
      }
    }
    if (note.type === 'verb' && note.verb.separablePrefix && !note.lemma.startsWith(note.verb.separablePrefix)) {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'verb', 'separablePrefix'],
        message: `lemma "${note.lemma}" does not start with prefix "${note.verb.separablePrefix}"`,
      });
    }
  });
});

export type Note = z.infer<typeof NoteSchema>;
export type NoteType = Note['type'];
export type Direction = z.infer<typeof DirectionSchema>;
export type Rektion = z.infer<typeof RektionSchema>;

/** Parses and validates raw JSON content; throws a readable error on failure. */
export function parseNotes(raw: unknown): Note[] {
  const result = NotesFileSchema.safeParse(raw);
  if (!result.success) {
    const lines = result.error.issues.map((issue) => `  [${issue.path.join('.')}] ${issue.message}`);
    throw new Error(`cards.json is invalid:\n${lines.join('\n')}`);
  }
  return result.data;
}
