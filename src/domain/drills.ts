import { buildHeadword, headwordToString } from './format';
import type { GrammarTopic } from './grammar';
import { parseInline } from './grammar';
import type { Note } from './schema';
import { familyOf, memberLabel, PREFIX_MEANINGS, type VerbFamily } from './families';
import type { RedemittelGroup } from './redemittel';
import { REGISTER_LABELS, topicPhrases, type StreetTopic } from './street';

/**
 * Practice drills. Pure question generators: they never touch the FSRS schedule,
 * so the learner can practise as much as they like.
 */
export type DrillKind =
  | 'artikel'
  | 'verben'
  | 'rektion'
  | 'adjektiv'
  | 'schreiben'
  | 'zor'
  | 'dikte'
  | 'satzbau'
  | 'gramer'
  | 'sokak'
  | 'kalip'
  | 'aile';

export type Field =
  | { kind: 'choice'; label: string; options: string[]; answer: string }
  | { kind: 'text'; label: string; answers: string[] }
  /** Put the shuffled `tokens` back into the order of `answer`. */
  | { kind: 'order'; label: string; tokens: string[]; answer: string[] };

export interface Question {
  /** Stable id (for re-queuing mistakes). */
  id: string;
  title: string;
  subtitle?: string;
  /** Sentence with numbered gaps, for grammar cloze questions. */
  sentence?: string;
  /** German text spoken when the question opens (dictation) or on demand. */
  audio?: string;
  /** Hide the German text and rely on audio only (dictation). */
  audioOnly?: boolean;
  /** The audio does not reveal the answer, so it can be played before answering. */
  audioInPrompt?: boolean;
  fields: Field[];
  /** Shown after answering: the full correct form. */
  solution: string;
  /** Optional Turkish explanation / translation shown after answering. */
  explain?: string;
  /** What this question trains ("gramer:<topicId>"); results are counted per skill. Defaults to the drill kind. */
  skill?: string;
}

export type Random = () => number;

export function shuffle<T>(items: readonly T[], random: Random = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

const plain = (value: string) => value.replaceAll('**', '');

// ---------- Note-based drills ----------

/** "sendete/sandte" → both forms are accepted; the full string stays the displayed answer. */
export function alternatives(value: string): string[] {
  const parts = value.split('/').map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? [value, ...parts] : [value];
}

export function artikelQuestions(notes: Note[]): Question[] {
  return notes.flatMap((note) =>
    note.type === 'noun'
      ? [
          {
            id: note.id,
            title: note.lemma,
            subtitle: note.meaningTr,
            audio: `${note.noun.gender} ${note.lemma}`,
            fields: [{ kind: 'choice', label: 'Artikel', options: ['der', 'die', 'das'], answer: note.noun.gender }],
            solution: headwordToString(buildHeadword(note)),
          } satisfies Question,
        ]
      : [],
  );
}

/** Accepted Präteritum/Partizip answers; "haben/sein" accepts either auxiliary. */
export function verbQuestions(notes: Note[]): Question[] {
  return notes.flatMap((note) => {
    if (note.type !== 'verb') return [];
    const { praeteritum, partizip2, auxiliary } = note.verb;
    const headword = buildHeadword(note);
    const auxOptions = ['haben', 'sein'];
    return [
      {
        id: note.id,
        title: headword.main.replace('|', ''),
        subtitle: note.meaningTr,
        audio: `${note.lemma}, ${praeteritum}, ${auxiliary === 'sein' ? 'ist' : 'hat'} ${partizip2}`,
        fields: [
          { kind: 'text', label: 'Präteritum (er/sie)', answers: alternatives(praeteritum) },
          { kind: 'text', label: 'Partizip II', answers: alternatives(partizip2) },
          {
            kind: 'choice',
            label: 'Yardımcı fiil',
            options: auxOptions,
            // "haben/sein": both are right, the UI accepts the first one picked.
            answer: auxiliary === 'haben/sein' ? 'haben/sein' : auxiliary,
          },
        ],
        solution: `${note.lemma} – ${praeteritum} – ${auxiliary === 'haben/sein' ? 'hat/ist' : auxiliary === 'sein' ? 'ist' : 'hat'} ${partizip2}`,
      } satisfies Question,
    ];
  });
}

/** Prepositions that commonly appear in a Rektion; wrong options for the preposition choice come from here. */
export const REKTION_PREPOSITIONS = ['an', 'auf', 'aus', 'bei', 'für', 'gegen', 'in', 'mit', 'nach', 'über', 'um', 'von', 'vor', 'zu'];

/** Prepositions learners typically mix up with a given one; these are offered first as wrong options. */
export const CONFUSABLE_PREPOSITIONS: Record<string, string[]> = {
  an: ['auf', 'in', 'über'],
  auf: ['an', 'über', 'für'],
  aus: ['von', 'bei', 'nach'],
  bei: ['mit', 'an', 'zu'],
  für: ['vor', 'auf', 'über'],
  gegen: ['für', 'an', 'vor'],
  in: ['an', 'auf', 'bei'],
  mit: ['bei', 'von', 'zu'],
  nach: ['zu', 'um', 'auf'],
  über: ['von', 'auf', 'an'],
  um: ['für', 'nach', 'über'],
  unter: ['über', 'bei', 'vor'],
  von: ['über', 'aus', 'vor'],
  vor: ['für', 'über', 'von'],
  zu: ['nach', 'an', 'für'],
  zwischen: ['unter', 'bei', 'mit'],
};

/**
 * The right preposition plus three wrong ones, shuffled. Wrong options are the usual confusables,
 * topped up from the common list; `alsoRight` (other prepositions of the same note) never appear.
 */
export function prepositionOptions(answer: string, random: Random = Math.random, alsoRight: string[] = []): string[] {
  const allowed = (p: string) => p !== answer && !alsoRight.includes(p);
  const wrong = (CONFUSABLE_PREPOSITIONS[answer] ?? []).filter(allowed);
  for (const p of shuffle(REKTION_PREPOSITIONS, random)) {
    if (wrong.length >= 3) break;
    if (allowed(p) && !wrong.includes(p)) wrong.push(p);
  }
  return shuffle([answer, ...wrong.slice(0, 3)], random);
}

export function rektionQuestions(notes: Note[], random: Random = Math.random): Question[] {
  return notes.flatMap((note) => {
    const entry = note.rektion.find((r) => r.preposition);
    if (!entry || !entry.preposition) return [];
    const headword = buildHeadword(note);
    const name = note.type === 'noun' ? `${note.noun.gender} ${note.lemma}` : headword.main.replace('|', '');
    return [
      {
        id: note.id,
        title: `${name} ___ + ?`,
        subtitle: note.meaningTr,
        fields: [
          { kind: 'choice', label: 'Edat', options: prepositionOptions(
              entry.preposition,
              random,
              note.rektion.flatMap((r) => (r.preposition ? [r.preposition] : [])),
            ), answer: entry.preposition },
          { kind: 'choice', label: 'Hâl', options: ['Akk', 'Dat', 'Gen'], answer: entry.case },
        ],
        solution: `${name} ${entry.preposition} + ${entry.case}`,
        explain: note.examples[0]?.de,
      } satisfies Question,
    ];
  });
}

/** The German answer for tr→de typing: nouns with article, verbs optionally with "sich". */
export function typedAnswers(note: Note): string[] {
  switch (note.type) {
    case 'noun':
      return [`${note.noun.gender} ${note.lemma}`];
    case 'verb':
      return note.verb.reflexive ? [`sich ${note.lemma}`, note.lemma] : [note.lemma];
    default:
      return [note.lemma];
  }
}

export function writingQuestions(notes: Note[]): Question[] {
  return notes.map((note) => ({
    id: note.id,
    title: note.meaningTr,
    subtitle: note.hintTr,
    audio: buildHeadword(note).speech,
    fields: [{ kind: 'text', label: note.type === 'noun' ? 'Almancası (artikeliyle)' : 'Almancası', answers: typedAnswers(note) }],
    solution: headwordToString(buildHeadword(note)),
    explain: note.examples[0] ? `${note.examples[0].de}${note.examples[0].tr ? ` — ${note.examples[0].tr}` : ''}` : undefined,
  }));
}

export function dictationQuestions(notes: Note[]): Question[] {
  return notes.flatMap((note) =>
    note.examples
      .filter((example) => example.de.split(' ').length <= 14)
      .map((example, index) => ({
        id: `${note.id}#${index}`,
        title: 'Dinle ve yaz',
        subtitle: 'Cümleyi duyduğun gibi yaz.',
        audio: example.de,
        audioOnly: true,
        fields: [{ kind: 'text', label: 'Cümle', answers: [example.de] }],
        solution: example.de,
        explain: example.tr,
      })),
  );
}

/** Words of a sentence as movable tokens; the final full stop is dropped so it does not give the end away. */
export function sentenceTokens(sentence: string): string[] {
  return sentence
    .trim()
    .replace(/[.!?]+$/, '')
    .split(/\s+/)
    .filter(Boolean);
}

/** A shuffle that never returns the solved order (possible for every sentence with two different tokens). */
function scramble(tokens: string[], random: Random): string[] {
  for (let attempt = 0; attempt < 8; attempt++) {
    const mixed = shuffle(tokens, random);
    if (mixed.some((token, index) => token !== tokens[index])) return mixed;
  }
  return [...tokens].reverse();
}

export const ORDER_MIN_WORDS = 4;
export const ORDER_MAX_WORDS = 9;

/**
 * Word order: the Turkish translation is the prompt, the learner rebuilds the German example.
 * Short sentences only, so there is (nearly) always one natural order.
 */
export function orderQuestions(notes: Note[], random: Random = Math.random): Question[] {
  return notes.flatMap((note) =>
    note.examples.flatMap((example, index) => {
      const answer = sentenceTokens(example.de);
      // Dialogue lines, quotes and "…" fragments make poor ordering tasks.
      if (!example.tr || answer.length < ORDER_MIN_WORDS || answer.length > ORDER_MAX_WORDS || /[„“"…:;()]/.test(example.de)) return [];
      if (new Set(answer).size < 2) return [];
      return [
        {
          id: `${note.id}#o${index}`,
          title: 'Cümleyi kur',
          subtitle: example.tr,
          fields: [{ kind: 'order' as const, label: 'Kelimeleri doğru sıraya koy', tokens: scramble(answer, random), answer }],
          solution: example.de,
          audio: example.de,
        } satisfies Question,
      ];
    }),
  );
}

// ---------- Content-based drills ----------

/**
 * Grammar cloze: example sentences in the grammar reference mark the key form in **bold**.
 * Those bold parts become the gaps, so every grammar topic gets an exercise for free.
 */
export function grammarQuestions(topics: GrammarTopic[]): Question[] {
  return topics.flatMap((topic) =>
    topic.blocks.flatMap((block) =>
      block.type !== 'examples'
        ? []
        : block.items.flatMap((item, index) => {
            const segments = parseInline(item.de);
            const gaps = segments.filter((segment) => segment.bold);
            const fitsAsGap = (text: string) => text.trim().split(/\s+/).length <= 3 && /\p{L}/u.test(text);
            if (gaps.length === 0 || gaps.length > 3 || !gaps.every((gap) => fitsAsGap(gap.text))) return [];
            if (!segments.some((segment) => !segment.bold && /\p{L}/u.test(segment.text))) return [];
            let n = 0;
            const sentence = segments.map((segment) => (segment.bold ? `(${++n}) ___` : segment.text)).join('');
            return [
              {
                id: `${topic.id}#${index}`,
                skill: `gramer:${topic.id}`,
                title: topic.titleDe,
                subtitle: item.tr,
                sentence,
                fields: gaps.map((gap, i) => ({ kind: 'text' as const, label: `(${i + 1})`, answers: [gap.text.trim()] })),
                solution: plain(item.de),
                explain: `${topic.level} · ${topic.titleTr}`,
                audio: plain(item.de),
              } satisfies Question,
            ];
          }),
    ),
  );
}

/** Street German: what does this phrase mean? Distractors come from other phrases. */
export function streetQuestions(topics: StreetTopic[], random: Random = Math.random): Question[] {
  const all = topics.flatMap((topic) => topicPhrases(topic).map((phrase) => ({ topic, phrase })));
  return all.map(({ topic, phrase }, index) => {
    const others = shuffle(
      all.filter((other) => other.phrase.tr !== phrase.tr),
      random,
    ).slice(0, 3);
    const options = shuffle([phrase.tr, ...others.map((other) => other.phrase.tr)], random);
    return {
      id: `${topic.id}#${index}`,
      title: plain(phrase.de),
      subtitle: `${topic.icon} ${topic.titleTr}`,
      audio: plain(phrase.de),
      audioInPrompt: true,
      fields: [{ kind: 'choice', label: 'Anlamı', options, answer: phrase.tr }],
      solution: `${plain(phrase.de)} = ${phrase.tr}`,
      explain: [REGISTER_LABELS[phrase.register] + (phrase.region ? ` · ${phrase.region}` : ''), phrase.note]
        .filter(Boolean)
        .join(' — '),
    } satisfies Question;
  });
}

/**
 * Redemittel: "how do you say this in German?" The wrong options come from OTHER groups,
 * so the learner has to know which phrase does which job.
 */
export function redemittelQuestions(groups: RedemittelGroup[], random: Random = Math.random): Question[] {
  return groups.flatMap((group) => {
    const others = groups.filter((other) => other.id !== group.id).flatMap((other) => other.items);
    return group.items.map((item, index) => {
      const distractors = shuffle(others, random).slice(0, 3);
      return {
        id: `${group.id}#${index}`,
        skill: `kalip:${group.id}`,
        title: item.tr,
        subtitle: `${group.icon} ${group.titleTr}`,
        fields: [
          {
            kind: 'choice',
            label: 'Almancası',
            options: shuffle([item.de, ...distractors.map((other) => other.de)], random),
            answer: item.de,
          },
        ],
        solution: item.example.de,
        audio: item.example.de,
        explain: [item.example.tr, item.note].filter(Boolean).join(' — '),
      } satisfies Question;
    });
  });
}

// ---------- Session ----------

export const ROUND_SIZE = 15;

/** Picks a round: random order, optionally capped. */
export function pickRound(questions: Question[], size = ROUND_SIZE, random: Random = Math.random): Question[] {
  return shuffle(questions, random).slice(0, size);
}

// ---------- Verb families ----------

/**
 * "Which prefix?": the Turkish meaning plus the stem, options are the verb's own family
 * (abbauen / aufbauen / umbauen), so the learner has to tell the relatives apart.
 * Families come from all notes; questions only for the notes in scope.
 */
export function familyQuestions(notes: Note[], families: Map<string, VerbFamily>, random: Random = Math.random): Question[] {
  return notes.flatMap((note) => {
    const family = familyOf(families, note);
    const self = family?.members.find((m) => m.note.id === note.id);
    if (!family || !self) return [];
    const answer = memberLabel(self);
    const others = shuffle(
      [...new Set(family.members.filter((m) => m.note.id !== note.id).map(memberLabel))].filter((label) => label !== answer),
      random,
    ).slice(0, 3);
    const meaning = self.prefix ? PREFIX_MEANINGS[self.prefix] : undefined;
    return [
      {
        id: note.id,
        title: note.meaningTr,
        subtitle: `kök: ${family.stem}`,
        fields: [{ kind: 'choice', label: 'Fiil', options: shuffle([answer, ...others], random), answer }],
        solution: answer,
        explain: [meaning && `${self.prefix}-: ${meaning}`, note.examples[0]?.de].filter(Boolean).join(' · '),
        skill: 'aile',
      } satisfies Question,
    ];
  });
}
