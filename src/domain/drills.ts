import { buildHeadword, headwordToString } from './format';
import type { GrammarTopic } from './grammar';
import { parseInline } from './grammar';
import type { Note } from './schema';
import type { RedemittelGroup } from './redemittel';
import { REGISTER_LABELS, topicPhrases, type StreetTopic } from './street';

/**
 * Practice drills. Pure question generators: they never touch the FSRS schedule,
 * so the learner can practise as much as they like.
 */
export type DrillKind = 'artikel' | 'verben' | 'rektion' | 'adjektiv' | 'schreiben' | 'zor' | 'dikte' | 'gramer' | 'sokak' | 'kalip';

export type Field =
  | { kind: 'choice'; label: string; options: string[]; answer: string }
  | { kind: 'text'; label: string; answers: string[] };

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

export function rektionQuestions(notes: Note[]): Question[] {
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
          { kind: 'text', label: 'Edat', answers: [entry.preposition] },
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
