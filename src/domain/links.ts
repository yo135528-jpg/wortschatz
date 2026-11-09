import type { Note } from './schema';

/**
 * Links words to grammar topics without hand-maintaining a field on every note:
 * structural facts (reflexive, separable, Rektion …) plus keywords in the
 * note's grammar text. Topic ids must exist in src/data/grammar (checked by a test).
 */
const KEYWORDS: [pattern: RegExp, topic: string][] = [
  [/n-deklination/i, 'n-deklination'],
  [/zustandspassiv/i, 'zustandspassiv'],
  [/\bpassiv\b/i, 'passiv'],
  [/konjunktiv ii|konjunktiv 2|würde/i, 'konjunktiv-2-irreal'],
  [/konjunktiv i\b/i, 'konjunktiv-1'],
  [/genitiv/i, 'genitiv'],
  [/präteritum|düzensiz/i, 'praeteritum'],
  [/partizip/i, 'partizip-2'],
  [/plusquamperfekt/i, 'plusquamperfekt'],
  [/\bzu\b.*mastar|mastar.*\bzu\b|um \.\.\. zu|um … zu/i, 'infinitiv-mit-zu'],
  [/entweder|sowohl|weder|zwar|einerseits|nicht nur/i, 'zweiteilige-konnektoren'],
  [/relativ/i, 'relativsaetze'],
  [/\bje\b.*\bdesto\b|\bje\b.*\bumso\b/i, 'je-desto'],
  [/als ob/i, 'als-ob'],
  [/-ung|-heit|-keit|-schaft|-nis|-ion\b/i, 'nachsilben-nomen'],
];

const CONNECTORS: Record<string, string> = {
  obwohl: 'konnektoren-b2',
  obgleich: 'konnektoren-b2',
  trotzdem: 'konnektoren-adverbien',
  deshalb: 'konnektoren-adverbien',
  deswegen: 'konnektoren-adverbien',
  darum: 'konnektoren-adverbien',
  außerdem: 'konnektoren-adverbien',
  während: 'temporale-nebensaetze',
  nachdem: 'temporale-nebensaetze',
  bevor: 'temporale-nebensaetze',
  seitdem: 'temporale-nebensaetze',
  sobald: 'temporale-nebensaetze',
  bis: 'temporale-nebensaetze',
  damit: 'finalsaetze',
  weil: 'nebensaetze-weil-dass-wenn',
  dass: 'nebensaetze-weil-dass-wenn',
  falls: 'konnektoren-b2',
  indem: 'konnektoren-b2',
  sodass: 'konnektoren-b2',
};

/** Grammar topic ids relevant to a note, most specific first, without duplicates. */
export function grammarTopicsFor(note: Note): string[] {
  const topics: string[] = [];
  const add = (id: string) => {
    if (!topics.includes(id)) topics.push(id);
  };

  if (note.type === 'expression' && note.tags.includes('nomen-verb')) add('nomen-verb-verbindungen');
  if (note.type === 'verb') {
    if (note.verb.reflexive) add('reflexive-verben');
    if (note.verb.separablePrefix) add('trennbare-verben');
    if (note.rektion.some((r) => r.preposition)) add('verben-mit-praepositionen');
    if (note.rektion.some((r) => !r.preposition && r.case === 'Dat')) add('verben-mit-dativ');
  }
  if (note.type === 'adjective' && note.adjective.comparative) add('komparativ-superlativ');

  const text = [note.grammarTr, note.note].filter(Boolean).join(' ');
  // Adjectival nouns (der/die Angestellte): only nouns, the grammar text says "declined like an adjective".
  if (note.type === 'noun' && /sıfattan isim|sıfat gibi çekil/i.test(text)) add('adjektive-als-nomen');
  for (const [pattern, topic] of KEYWORDS) if (pattern.test(text)) add(topic);

  const connector = CONNECTORS[note.lemma.toLowerCase()];
  if (connector && (note.type === 'other' || note.type === 'expression')) add(connector);
  return topics;
}

/** All notes linked to one grammar topic, in book order. */
export function notesForTopic(notes: Iterable<Note>, topicId: string): Note[] {
  return [...notes].filter((note) => grammarTopicsFor(note).includes(topicId));
}

/** Every topic id the rules can produce (tests check they exist). */
export const LINKED_TOPIC_IDS = [
  ...new Set([
    'nomen-verb-verbindungen',
    'reflexive-verben',
    'trennbare-verben',
    'verben-mit-praepositionen',
    'verben-mit-dativ',
    'komparativ-superlativ',
    'adjektive-als-nomen',
    ...KEYWORDS.map(([, topic]) => topic),
    ...Object.values(CONNECTORS),
  ]),
];
