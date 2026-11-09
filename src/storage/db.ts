import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import { DEFAULT_SETTINGS, type CardState, type ReviewLogEntry, type Settings } from './types';

export const DB_NAME = 'wortschatz';
const DB_VERSION = 1;
const SETTINGS_KEY = 'settings';

interface WortschatzDB extends DBSchema {
  cards: { key: string; value: CardState };
  logs: { key: number; value: ReviewLogEntry; indexes: { byKey: string } };
  meta: { key: string; value: Settings };
}

export type Database = IDBPDatabase<WortschatzDB>;

export function openDatabase(): Promise<Database> {
  const dbPromise = openDB<WortschatzDB>(DB_NAME, DB_VERSION, {
    // Another tab (or a test) wants to upgrade/delete the DB: release our connection.
    blocking() {
      void dbPromise.then((db) => db.close());
    },
    upgrade(db) {
      db.createObjectStore('cards', { keyPath: 'key' });
      const logs = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
      logs.createIndex('byKey', 'key');
      db.createObjectStore('meta');
    },
  });
  return dbPromise;
}

export function getAllCardStates(db: Database): Promise<CardState[]> {
  return db.getAll('cards');
}

export async function putCardStates(db: Database, states: CardState[]): Promise<void> {
  const tx = db.transaction('cards', 'readwrite');
  await Promise.all([...states.map((state) => tx.store.put(state)), tx.done]);
}

/** Saves the new card state and its review log atomically. */
export async function saveReview(db: Database, state: CardState, log: ReviewLogEntry): Promise<number> {
  const tx = db.transaction(['cards', 'logs'], 'readwrite');
  const [, id] = await Promise.all([tx.objectStore('cards').put(state), tx.objectStore('logs').add(log), tx.done]);
  return id;
}

/** Reverts a review: restores the previous card state and deletes its log entry. */
export async function undoReview(db: Database, previous: CardState, logId: number): Promise<void> {
  const tx = db.transaction(['cards', 'logs'], 'readwrite');
  await Promise.all([tx.objectStore('cards').put(previous), tx.objectStore('logs').delete(logId), tx.done]);
}

export function getAllLogs(db: Database): Promise<ReviewLogEntry[]> {
  return db.getAll('logs');
}

export async function getSettings(db: Database): Promise<Settings> {
  const stored = await db.get('meta', SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(db: Database, settings: Settings): Promise<void> {
  await db.put('meta', settings, SETTINGS_KEY);
}

/** Replaces ALL review state. Used by import. */
export async function replaceAll(
  db: Database,
  data: { cards: CardState[]; logs: ReviewLogEntry[]; settings: Settings },
): Promise<void> {
  const tx = db.transaction(['cards', 'logs', 'meta'], 'readwrite');
  const cards = tx.objectStore('cards');
  const logs = tx.objectStore('logs');
  await Promise.all([cards.clear(), logs.clear()]);
  await Promise.all([
    ...data.cards.map((card) => cards.put(card)),
    ...data.logs.map((log) => logs.put(log)),
    tx.objectStore('meta').put(data.settings, SETTINGS_KEY),
    tx.done,
  ]);
}
