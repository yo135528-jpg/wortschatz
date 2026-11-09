import { parseGrammar, type GrammarTopic } from './domain/grammar';
import { parseStreet, type StreetTopic } from './domain/street';

/**
 * Reference content is loaded on first use (separate JS chunks), so the first
 * screen opens fast. Each loader parses once and caches the promise.
 */
let grammar: Promise<GrammarTopic[]> | null = null;
let street: Promise<StreetTopic[]> | null = null;

export function loadGrammar(): Promise<GrammarTopic[]> {
  grammar ??= import('./data/grammar').then((module) => parseGrammar(module.GRAMMAR_TOPICS));
  return grammar;
}

export function loadStreet(): Promise<StreetTopic[]> {
  street ??= import('./data/street').then((module) => parseStreet(module.STREET_TOPICS));
  return street;
}
