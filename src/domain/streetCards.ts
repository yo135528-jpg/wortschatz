import { shortHash, slugify } from './id';
import { NoteSchema, type Note } from './schema';
import { REGISTER_LABELS, topicPhrases, type StreetPhrase, type StreetTopic } from './street';

/**
 * Street-German phrases the learner chose to study become regular notes at runtime.
 * Only the phrase key is stored (in settings), the note is rebuilt from the content,
 * so the same phrase always gets the same note id and its FSRS state survives.
 */
const plain = (value: string) => value.replaceAll('**', '');

/** Stable key of a phrase: "<topicId>|<German text>". */
export function phraseKey(topic: StreetTopic, phrase: StreetPhrase): string {
  return `${topic.id}|${plain(phrase.de)}`;
}

/** Every word in its own gap, punctuation kept outside: "[Ich] [bin] [pleite]." */
export function fullCloze(text: string): string {
  return text
    .split(/\s+/)
    .map((word) => {
      const match = /^([„"(]*)(.*?)([.,!?;:…")]*)$/u.exec(word);
      const [, before = '', core = '', after = ''] = match ?? [];
      return core && /\p{L}/u.test(core) ? `${before}[${core}]${after}` : word;
    })
    .join(' ');
}

export function streetNote(topic: StreetTopic, phrase: StreetPhrase, createdAt: string): Note {
  const de = plain(phrase.de);
  const slug = slugify(de).slice(0, 40).replace(/-+$/, '') || 'phrase';
  const register = REGISTER_LABELS[phrase.register] + (phrase.region ? `, ${phrase.region}` : '');
  return NoteSchema.parse({
    id: `street-${slug}-${shortHash(phraseKey(topic, phrase))}`,
    type: 'expression',
    lemma: de,
    meaningTr: phrase.tr,
    hintTr: `sokak dili · ${register}`,
    cloze: fullCloze(de),
    clozeTr: phrase.tr,
    examples: [
      phrase.example
        ? { de: plain(phrase.example.de), tr: phrase.example.tr, fromBook: false }
        : { de, tr: phrase.tr, fromBook: false },
    ],
    note: [phrase.standard ? `Yazıda: ${phrase.standard}` : null, phrase.note].filter(Boolean).join(' · ') || null,
    source: `Sokak dili, ${topic.titleTr}`,
    tags: ['umgangssprache', 'sokak'],
    createdAt,
  });
}

/** Rebuilds the notes for the stored phrase keys; unknown keys (content changed) are skipped. */
export function streetNotes(topics: StreetTopic[], keys: readonly string[], createdAt: string): Note[] {
  const wanted = new Set(keys);
  return topics.flatMap((topic) =>
    topicPhrases(topic)
      .filter((phrase) => wanted.has(phraseKey(topic, phrase)))
      .map((phrase) => streetNote(topic, phrase, createdAt)),
  );
}
