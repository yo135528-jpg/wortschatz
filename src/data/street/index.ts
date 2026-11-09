import type { StreetTopicInput } from '../../domain/street';
import { BASICS } from './basics';
import { SITUATIONS } from './situations';
import { SLANG } from './slang';

/**
 * Street German ("Sokak dili"): how people really speak, topic by topic.
 * Explanations in Turkish, phrases in spoken German; validated by `npm run validate`.
 */
export const STREET_TOPICS: StreetTopicInput[] = [...BASICS, ...SITUATIONS, ...SLANG];
