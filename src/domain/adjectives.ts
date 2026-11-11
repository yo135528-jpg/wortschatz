import type { Question, Random } from './drills';
import type { Note } from './schema';

/**
 * Adjective declension drill ("mit groß___ Interesse" → -em).
 * Pure generator, like the other drills: it never touches the FSRS schedule.
 *
 * Two sources:
 *  - no article: a curated list of natural phrases (uncountable nouns, fixed combinations)
 *  - der/ein + adjective: generated from the learner's own nouns
 */
export type Case = 'Nom' | 'Akk' | 'Dat' | 'Gen';
export type NounClass = 'der' | 'die' | 'das' | 'pl';
export type ArticleKind = 'definite' | 'indefinite' | 'none';

export const ENDINGS = ['-e', '-en', '-er', '-es', '-em'] as const;

const ORDER: NounClass[] = ['der', 'die', 'das', 'pl'];

/** Endings per article kind and case, in the order der · die · das · plural. */
const TABLE: Record<ArticleKind, Record<Case, [string, string, string, string]>> = {
  definite: {
    Nom: ['e', 'e', 'e', 'en'],
    Akk: ['en', 'e', 'e', 'en'],
    Dat: ['en', 'en', 'en', 'en'],
    Gen: ['en', 'en', 'en', 'en'],
  },
  indefinite: {
    Nom: ['er', 'e', 'es', 'en'],
    Akk: ['en', 'e', 'es', 'en'],
    Dat: ['en', 'en', 'en', 'en'],
    Gen: ['en', 'en', 'en', 'en'],
  },
  none: {
    Nom: ['er', 'e', 'es', 'e'],
    Akk: ['en', 'e', 'es', 'e'],
    Dat: ['em', 'er', 'em', 'en'],
    Gen: ['en', 'er', 'en', 'er'],
  },
};

const DEFINITE: Record<Case, [string, string, string, string]> = {
  Nom: ['der', 'die', 'das', 'die'],
  Akk: ['den', 'die', 'das', 'die'],
  Dat: ['dem', 'der', 'dem', 'den'],
  Gen: ['des', 'der', 'des', 'der'],
};

const INDEFINITE: Record<Case, [string, string, string]> = {
  Nom: ['ein', 'eine', 'ein'],
  Akk: ['einen', 'eine', 'ein'],
  Dat: ['einem', 'einer', 'einem'],
  Gen: ['eines', 'einer', 'eines'],
};

const CASE_TR: Record<Case, string> = { Nom: 'Nominativ', Akk: 'Akkusativ', Dat: 'Dativ', Gen: 'Genitiv' };
const CLASS_TR: Record<NounClass, string> = { der: 'eril (der)', die: 'dişil (die)', das: 'nötr (das)', pl: 'çoğul' };
const KIND_TR: Record<ArticleKind, string> = {
  definite: 'belirli artikel (der/die/das)',
  indefinite: 'belirsiz artikel (ein/kein/mein)',
  none: 'artikel yok',
};

export function adjectiveEnding(kind: ArticleKind, kasus: Case, nounClass: NounClass): string {
  return TABLE[kind][kasus][ORDER.indexOf(nounClass)]!;
}

export function definiteArticle(kasus: Case, nounClass: NounClass): string {
  return DEFINITE[kasus][ORDER.indexOf(nounClass)]!;
}

/** Why this ending? One short Turkish sentence per article kind. */
export function explainEnding(kind: ArticleKind, kasus: Case, nounClass: NounClass): string {
  const ending = adjectiveEnding(kind, kasus, nounClass);
  const head = `${CASE_TR[kasus]}, ${CLASS_TR[nounClass]}, ${KIND_TR[kind]}`;
  if (kind === 'none') {
    // Genitive der/das is the one exception: the noun already shows the case (-s).
    if (kasus === 'Gen' && (nounClass === 'der' || nounClass === 'das')) {
      return `${head} → -en: hâli ismin -s eki gösteriyor, sıfata gerek kalmıyor.`;
    }
    return `${head} → sıfat artikelin ekini alır: ${definiteArticle(kasus, nounClass)} → -${ending}.`;
  }
  if (ending === 'en') return `${head} → -en: Dativ, Genitiv, çoğul ve eril Akkusativ (den/einen) hep -en.`;
  if (kind === 'indefinite' && (ending === 'er' || ending === 'es')) {
    return `${head} → -${ending}: „ein“ cinsiyeti göstermiyor, onu sıfat gösterir (${definiteArticle(kasus, nounClass)} → -${ending}).`;
  }
  return `${head} → -e: artikel hâli zaten gösteriyor, sıfat sadece -e alır.`;
}

interface Phrase {
  /** Text with "*" where the ending goes: "mit groß* Interesse". */
  text: string;
  kasus: Case;
  nounClass: NounClass;
  tr: string;
}

/** Natural phrases without an article. Only regular adjective stems. */
export const NO_ARTICLE_PHRASES: Phrase[] = [
  { text: 'mit groß* Interesse', kasus: 'Dat', nounClass: 'das', tr: 'büyük ilgiyle' },
  { text: 'mit groß* Freude', kasus: 'Dat', nounClass: 'die', tr: 'büyük sevinçle' },
  { text: 'mit negativ* Kritik', kasus: 'Dat', nounClass: 'die', tr: 'olumsuz eleştiriyle' },
  { text: 'mit kalt* Wasser', kasus: 'Dat', nounClass: 'das', tr: 'soğuk suyla' },
  { text: 'mit voll* Konzentration', kasus: 'Dat', nounClass: 'die', tr: 'tam konsantrasyonla' },
  { text: 'mit freundlich* Grüßen', kasus: 'Dat', nounClass: 'pl', tr: 'saygılarımla (mektup sonu)' },
  { text: 'bei schlecht* Wetter', kasus: 'Dat', nounClass: 'das', tr: 'kötü havada' },
  { text: 'bei stark* Regen', kasus: 'Dat', nounClass: 'der', tr: 'şiddetli yağmurda' },
  { text: 'unter groß* Druck', kasus: 'Dat', nounClass: 'der', tr: 'büyük baskı altında' },
  { text: 'aus eigen* Erfahrung', kasus: 'Dat', nounClass: 'die', tr: 'kendi deneyimimden' },
  { text: 'aus gut* Grund', kasus: 'Dat', nounClass: 'der', tr: 'haklı bir sebeple' },
  { text: 'aus persönlich* Gründen', kasus: 'Dat', nounClass: 'pl', tr: 'kişisel sebeplerle' },
  { text: 'nach lang* Zeit', kasus: 'Dat', nounClass: 'die', tr: 'uzun zaman sonra' },
  { text: 'seit kurz* Zeit', kasus: 'Dat', nounClass: 'die', tr: 'kısa bir süredir' },
  { text: 'in letzt* Zeit', kasus: 'Dat', nounClass: 'die', tr: 'son zamanlarda' },
  { text: 'ohne groß* Aufwand', kasus: 'Akk', nounClass: 'der', tr: 'fazla zahmete girmeden' },
  { text: 'ohne fremd* Hilfe', kasus: 'Akk', nounClass: 'die', tr: 'başkasının yardımı olmadan' },
  { text: 'ohne groß* Interesse', kasus: 'Akk', nounClass: 'das', tr: 'pek ilgi duymadan' },
  { text: 'auf eigen* Risiko', kasus: 'Akk', nounClass: 'das', tr: 'riski kendine ait olmak üzere' },
  { text: 'für gut* Arbeit', kasus: 'Akk', nounClass: 'die', tr: 'iyi iş için' },
  { text: 'Wir haben groß* Hunger.', kasus: 'Akk', nounClass: 'der', tr: 'Çok acıktık.' },
  { text: 'Ich habe groß* Lust auf Kaffee.', kasus: 'Akk', nounClass: 'die', tr: 'Canım çok kahve çekiyor.' },
  { text: 'Er hat groß* Glück gehabt.', kasus: 'Akk', nounClass: 'das', tr: 'Çok şanslıydı.' },
  { text: 'Ich trinke gern kalt* Tee.', kasus: 'Akk', nounClass: 'der', tr: 'Soğuk çay içmeyi severim.' },
  { text: 'Hier gibt es frisch* Obst.', kasus: 'Akk', nounClass: 'das', tr: 'Burada taze meyve var.' },
  { text: 'Sie hat nett* Kollegen.', kasus: 'Akk', nounClass: 'pl', tr: 'İyi iş arkadaşları var.' },
  { text: 'Das ist gut* Kaffee.', kasus: 'Nom', nounClass: 'der', tr: 'Bu iyi kahve.' },
  { text: 'Das ist frisch* Brot.', kasus: 'Nom', nounClass: 'das', tr: 'Bu taze ekmek.' },
  { text: 'Das sind nett* Leute.', kasus: 'Nom', nounClass: 'pl', tr: 'Bunlar iyi insanlar.' },
  { text: 'trotz groß* Angst', kasus: 'Gen', nounClass: 'die', tr: 'büyük korkuya rağmen' },
  { text: 'trotz schlecht* Wetters', kasus: 'Gen', nounClass: 'das', tr: 'kötü havaya rağmen' },
  { text: 'wegen stark* Regens', kasus: 'Gen', nounClass: 'der', tr: 'şiddetli yağmur yüzünden' },
];

function question(id: string, text: string, kind: ArticleKind, kasus: Case, nounClass: NounClass, subtitle: string): Question {
  const ending = adjectiveEnding(kind, kasus, nounClass);
  return {
    id,
    title: text.replace('*', '___'),
    subtitle,
    skill: `adjektiv:${kind}`,
    fields: [{ kind: 'choice', label: 'Sıfat eki', options: [...ENDINGS], answer: `-${ending}` }],
    solution: text.replace('*', ending),
    audio: text.replace('*', ending),
    explain: explainEnding(kind, kasus, nounClass),
  };
}

export function noArticleQuestions(): Question[] {
  return NO_ARTICLE_PHRASES.map((phrase) =>
    question(`none:${phrase.text}`, phrase.text, 'none', phrase.kasus, phrase.nounClass, phrase.tr),
  );
}

/** Adjectives that fit almost any noun and have a regular stem. */
const ADJECTIVES = ['neu', 'wichtig', 'interessant', 'bekannt', 'ander'];

/** Sentence frames per case; "{np}" is article + adjective + noun. */
const FRAMES: Record<Exclude<Case, 'Gen'>, string[]> = {
  Nom: ['Das ist {np}.', 'Hier steht {np}.'],
  Akk: ['Wir sprechen über {np}.', 'Ich denke an {np}.', 'Das ist für {np}.'],
  Dat: ['Wir sprechen von {np}.', 'Es beginnt mit {np}.', 'Ich bin mit {np} zufrieden.'],
};

/**
 * Nouns that can be used unchanged in every singular case:
 * no weak masculines (der Kollege → den Kollegen), no adjectival nouns (der Angestellte).
 */
function isSafeNoun(note: Note): note is Extract<Note, { type: 'noun' }> {
  if (note.type !== 'noun' || note.noun.plural === null) return false;
  if (/\s/.test(note.lemma)) return false;
  return !(note.noun.gender === 'der' && /^-e?n$/.test(note.noun.plural));
}

/** der/ein + adjective + one of the learner's nouns (singular; genitive only for feminine nouns). */
export function articleQuestions(notes: Note[], random: Random = Math.random): Question[] {
  const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)]!;
  return notes.filter(isSafeNoun).flatMap((note) => {
    const gender = note.noun.gender;
    const kind: ArticleKind = random() < 0.5 ? 'definite' : 'indefinite';
    const cases: Case[] = gender === 'die' ? ['Nom', 'Akk', 'Dat', 'Gen'] : ['Nom', 'Akk', 'Dat'];
    const kasus = pick(cases);
    const article =
      kind === 'definite' ? definiteArticle(kasus, gender) : INDEFINITE[kasus][ORDER.indexOf(gender)]!;
    const np = `${article} ${pick(ADJECTIVES)}* ${note.lemma}`;
    const text = kasus === 'Gen' ? `wegen ${np}` : pick(FRAMES[kasus]).replace('{np}', np);
    return [question(`${kind}:${note.id}`, text, kind, kasus, gender, `${note.lemma} = ${note.meaningTr}`)];
  });
}
