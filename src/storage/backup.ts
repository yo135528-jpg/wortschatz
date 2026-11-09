import { z } from 'zod';
import type { CardState, ReviewLogEntry, Settings } from './types';

export const BACKUP_FORMAT = 'wortschatz-backup';
export const BACKUP_VERSION = 1;

export interface Backup {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  settings: Settings;
  cards: CardState[];
  logs: ReviewLogEntry[];
}

const isoDate = z.iso.datetime().transform((value) => new Date(value));
const nullableIsoDate = isoDate.nullable();

// FSRS objects are kept loose (extra fields are preserved) so a newer
// ts-fsrs version with additional fields does not break import.
const FsrsCardSchema = z.looseObject({
  dueAt: isoDate,
  lastReviewAt: nullableIsoDate,
  state: z.number(),
});

const FsrsRevlogSchema = z.looseObject({
  dueAt: isoDate,
  lastReviewAt: nullableIsoDate,
  reviewTime: isoDate,
  rating: z.number(),
  state: z.number(),
});

const BackupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  settings: z.object({
    desiredRetention: z.number().min(0.7).max(0.99),
    newPerDay: z.number().int().min(0),
    reviewsPerDay: z.number().int().min(0),
    mode: z.enum(['de2tr', 'tr2de', 'mixed']),
    // Added later: older backups do not have them.
    scope: z.string().default(''),
    typeAnswers: z.boolean().default(false),
  }),
  cards: z.array(
    z.object({
      key: z.string(),
      noteId: z.string(),
      direction: z.enum(['de2tr', 'tr2de']),
      suspended: z.boolean(),
      fsrs: FsrsCardSchema,
    }),
  ),
  logs: z.array(
    z.object({
      id: z.number().int().optional(),
      key: z.string(),
      revlog: FsrsRevlogSchema,
    }),
  ),
});

export function createBackup(cards: CardState[], logs: ReviewLogEntry[], settings: Settings, now: Date): Backup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    settings,
    cards,
    logs,
  };
}

/** Parses an exported JSON string and turns ISO strings back into Date objects. */
export function parseBackup(json: string): Backup {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('Backup file is not valid JSON.');
  }
  const result = BackupSchema.safeParse(raw);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new Error(`Backup file is invalid: [${first?.path.join('.')}] ${first?.message}`);
  }
  // The loose schemas keep every FSRS field; the cast restores the full library types.
  return result.data as unknown as Backup;
}
