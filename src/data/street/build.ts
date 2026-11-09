import type { Register, StreetBlock, StreetPhrase, StreetTopicInput } from '../../domain/street';

/** Small builders that keep the authored street-German content readable. */
export const topic = (input: StreetTopicInput): StreetTopicInput => input;
export const p = (text: string): StreetBlock => ({ type: 'text', text });
export const tip = (text: string): StreetBlock => ({ type: 'tip', text });
export const warn = (text: string): StreetBlock => ({ type: 'warning', text });

type Extra = Partial<Pick<StreetPhrase, 'standard' | 'region' | 'note'>> & { ex?: [de: string, tr: string] };

/** One phrase: say('Haste Zeit?', 'Vaktin var mı?', 'locker', { standard: 'Hast du Zeit?' }). */
export function say(de: string, tr: string, register: Register, extra: Extra = {}): StreetPhrase {
  const { ex, ...rest } = extra;
  return { de, tr, register, ...rest, ...(ex ? { example: { de: ex[0], tr: ex[1] } } : {}) };
}

export const phrases = (heading: string | undefined, ...items: StreetPhrase[]): StreetBlock => ({
  type: 'phrases',
  ...(heading ? { heading } : {}),
  items,
});

/** Dialogue lines as [speaker, de, tr]. */
export const dialogue = (title: string, ...lines: [speaker: string, de: string, tr: string][]): StreetBlock => ({
  type: 'dialogue',
  title,
  lines: lines.map(([speaker, de, tr]) => ({ speaker, de, tr })),
});

export const table = (head: string[], rows: string[][], caption?: string): StreetBlock => ({
  type: 'table',
  head,
  rows,
  ...(caption ? { caption } : {}),
});
