import type { Direction } from '../domain/schema';
import type { FsrsCard, FsrsRevlog } from '../scheduling/fsrs';

export type StudyMode = 'de2tr' | 'tr2de' | 'mixed';

/** Review state of one card (one direction of one note). Lives in IndexedDB. */
export interface CardState {
  /** "<noteId>:<direction>" — primary key. */
  key: string;
  noteId: string;
  direction: Direction;
  fsrs: FsrsCard;
  suspended: boolean;
}

export interface ReviewLogEntry {
  /** Auto-increment key assigned by IndexedDB. */
  id?: number;
  key: string;
  revlog: FsrsRevlog;
}

export interface Settings {
  desiredRetention: number;
  newPerDay: number;
  reviewsPerDay: number;
  mode: StudyMode;
  /** Which words the review uses: "" = all, "c:<chapter>", "p:<page>" (see domain/scope). */
  scope: string;
  /** tr2de cards: type the answer before flipping. */
  typeAnswers: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  desiredRetention: 0.9,
  newPerDay: 15,
  reviewsPerDay: 200,
  mode: 'mixed',
  scope: '',
  typeAnswers: false,
};
