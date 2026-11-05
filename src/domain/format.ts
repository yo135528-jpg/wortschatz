import type { Note, Rektion } from './schema';

export type Gender = 'der' | 'die' | 'das';

/** Structured headword so the UI can color the article and style the parts. */
export interface Headword {
  /** Article for nouns (color-coded by gender). */
  article: Gender | null;
  /** Main text, e.g. "sich entscheiden" or "an|kommen". */
  main: string;
  /** Plural notation for nouns, e.g. "-en". */
  plural: string | null;
  /** Government, e.g. "für + Akk". */
  rektion: string | null;
  /** Secondary forms, e.g. "entschied · hat entschieden". */
  forms: string | null;
  /** Plain German text for text-to-speech. */
  speech: string;
}

export function formatRektion(rektion: Rektion[]): string | null {
  if (rektion.length === 0) return null;
  return rektion
    .map((entry) => (entry.preposition ? `${entry.preposition} + ${entry.case}` : `+ ${entry.case}`))
    .join(' / ');
}

function auxiliaryForm(auxiliary: 'haben' | 'sein' | 'haben/sein'): string {
  if (auxiliary === 'haben') return 'hat';
  if (auxiliary === 'sein') return 'ist';
  return 'hat/ist';
}

export function buildHeadword(note: Note): Headword {
  const rektion = formatRektion(note.rektion);

  switch (note.type) {
    case 'noun': {
      const { gender, plural } = note.noun;
      return {
        article: gender,
        main: note.lemma,
        plural: plural ?? 'nur Sg.',
        rektion,
        forms: null,
        speech: `${gender} ${note.lemma}`,
      };
    }
    case 'verb': {
      const { reflexive, separablePrefix, praeteritum, partizip2, auxiliary } = note.verb;
      const stem = separablePrefix
        ? `${separablePrefix}|${note.lemma.slice(separablePrefix.length)}`
        : note.lemma;
      const sich = reflexive === 'Dat' ? 'sich (Dat) ' : reflexive === 'Akk' ? 'sich ' : '';
      return {
        article: null,
        main: `${sich}${stem}`,
        plural: null,
        rektion,
        forms: `${praeteritum} · ${auxiliaryForm(auxiliary)} ${partizip2}`,
        speech: `${reflexive ? 'sich ' : ''}${note.lemma}`,
      };
    }
    case 'adjective': {
      const { comparative, superlative } = note.adjective;
      const forms = [comparative, superlative ? `am ${superlative}` : null].filter(Boolean).join(' · ');
      return { article: null, main: note.lemma, plural: null, rektion, forms: forms || null, speech: note.lemma };
    }
    default:
      return { article: null, main: note.lemma, plural: null, rektion, forms: null, speech: note.lemma };
  }
}

/** One-line headword, e.g. "die Entscheidung, -en" or "sich entscheiden für + Akk". */
export function headwordToString(headword: Headword): string {
  let text = headword.article ? `${headword.article} ${headword.main}` : headword.main;
  if (headword.plural) text += `, ${headword.plural}`;
  if (headword.rektion) text += ` ${headword.rektion}`;
  return text;
}

const TYPE_LABELS_TR: Record<Note['type'], string> = {
  noun: 'isim',
  verb: 'fiil',
  adjective: 'sıfat',
  expression: 'kalıp',
  other: 'diğer',
};

export function typeLabelTr(type: Note['type']): string {
  return TYPE_LABELS_TR[type];
}
