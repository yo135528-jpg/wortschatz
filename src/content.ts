import { parseGrammar, type GrammarTopic } from './domain/grammar';
import { parseRedemittel, type RedemittelGroup } from './domain/redemittel';
import { parseStreet, type StreetTopic } from './domain/street';
import { parseStories, type Story } from './domain/stories';

/**
 * Reference content is loaded on first use (separate JS chunks), so the first
 * screen opens fast. Each loader parses once and caches the promise.
 */
let grammar: Promise<GrammarTopic[]> | null = null;
let street: Promise<StreetTopic[]> | null = null;
let redemittel: Promise<RedemittelGroup[]> | null = null;
let stories: Promise<Story[]> | null = null;

export function loadGrammar(): Promise<GrammarTopic[]> {
  grammar ??= import('./data/grammar').then((module) => parseGrammar(module.GRAMMAR_TOPICS));
  return grammar;
}

export function loadRedemittel(): Promise<RedemittelGroup[]> {
  redemittel ??= import('./data/redemittel').then((module) => parseRedemittel(module.REDEMITTEL));
  return redemittel;
}

export function loadStreet(): Promise<StreetTopic[]> {
  street ??= import('./data/street').then((module) => parseStreet(module.STREET_TOPICS));
  return street;
}

export function loadStories(): Promise<Story[]> {
  stories ??= import('./data/stories').then((module) => parseStories(module.STORIES));
  return stories;
}
