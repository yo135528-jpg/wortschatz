import type { GrammarTopicInput } from '../../domain/grammar';
import { A1 } from './a1';
import { A2 } from './a2';
import { B1 } from './b1';
import { B2 } from './b2';

/**
 * Grammar reference content, A1 to B2. Written in Turkish with German examples.
 * Level split follows the Goethe-Institut / Profile deutsch inventories; validated by `npm run validate`.
 */
export const GRAMMAR_TOPICS: GrammarTopicInput[] = [...A1, ...A2, ...B1, ...B2];
