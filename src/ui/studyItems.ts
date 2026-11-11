import type { DrillKind } from '../domain/drills';
import { buildRows } from './browseModel';
import { DRILLS } from './drill';
import type { StudyItem } from './study';

/** Display order of the drills in the "Çalış" hub. */
const ORDER: DrillKind[] = ['schreiben', 'artikel', 'verben', 'rektion', 'adjektiv', 'zor', 'dikte', 'gramer', 'kalip', 'sokak'];

export const STUDY_ITEMS: StudyItem[] = ORDER.map((kind) => ({
  route: { name: 'drill', kind },
  icon: DRILLS[kind].icon,
  title: DRILLS[kind].title,
  description: DRILLS[kind].description,
  testId: `study-${kind}`,
  badge:
    kind === 'zor'
      ? (app) => {
          const count = buildRows([...app.notes.values()], app.allStates).filter((row) => row.lapses > 0).length;
          return count ? `${count} kelime` : null;
        }
      : undefined,
}));
