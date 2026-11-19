import type { StreetGroup, StreetTopicInput } from '../../domain/street';
import { BASICS } from './basics';
import { CARS } from './cars';
import { OFFICIAL } from './official';
import { PEOPLE } from './people';
import { SITUATIONS } from './situations';
import { SLANG } from './slang';

/** Library section of the older topics that do not set `group` themselves. */
const GROUP_OF: Record<string, StreetGroup> = {
  'gesprochene-formen': 'temel',
  'gesprochene-grammatik': 'temel',
  partikeln: 'temel',
  fuellwoerter: 'temel',
  reaktionen: 'temel',
  'ja-nein': 'temel',
  begruessung: 'insan',
  hoeflichkeit: 'insan',
  freunde: 'insan',
  gefuehle: 'insan',
  geld: 'argo',
  redewendungen: 'argo',
  jugendsprache: 'argo',
  regional: 'argo',
  fluchen: 'argo',
};

const withGroup = (topic: StreetTopicInput): StreetTopicInput => ({ ...topic, group: topic.group ?? GROUP_OF[topic.id] });

/**
 * Street German ("Sokak dili"): how people really speak, topic by topic.
 * Explanations in Turkish, phrases in spoken German; validated by `npm run validate`.
 */
export const STREET_TOPICS: StreetTopicInput[] = [...BASICS, ...SITUATIONS, ...CARS, ...PEOPLE, ...OFFICIAL, ...SLANG].map(withGroup);
