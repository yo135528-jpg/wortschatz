import type { GrammarBlock, GrammarTopicInput } from '../../domain/grammar';

/** Small builders that keep the authored grammar content readable. */
export const topic = (input: GrammarTopicInput): GrammarTopicInput => input;
export const p = (text: string): GrammarBlock => ({ type: 'text', text });
export const tip = (text: string): GrammarBlock => ({ type: 'tip', text });
export const warn = (text: string): GrammarBlock => ({ type: 'warning', text });
export const table = (head: string[], rows: string[][], caption?: string): GrammarBlock => ({
  type: 'table',
  head,
  rows,
  ...(caption ? { caption } : {}),
});
export const ex = (...items: [de: string, tr: string][]): GrammarBlock => ({
  type: 'examples',
  items: items.map(([de, tr]) => ({ de, tr })),
});
