import type { Note } from './domain/schema';
import { inScope } from './domain/scope';
import { createBackup, parseBackup } from './storage/backup';
import {
  getAllCardStates,
  getAllLogs,
  getSettings,
  putCardStates,
  replaceAll,
  saveReview,
  saveSettings,
  undoReview,
  type Database,
} from './storage/db';
import { mergeState } from './storage/merge';
import type { CardState, ReviewLogEntry, Settings } from './storage/types';
import { createScheduler, newFsrsCard, rateCard, type ButtonGrade, type Scheduler } from './scheduling/fsrs';
import { buildQueue, nextLearningDue } from './scheduling/queue';
import { computeStats, type Stats } from './scheduling/stats';
import { startOfStudyDay } from './scheduling/day';

/**
 * Application state and actions. The UI reads from here and calls the actions;
 * every action persists to IndexedDB before updating in-memory state.
 */
const UNDO_LIMIT = 20;

export class App {
  private listeners = new Set<() => void>();
  /** Recent ratings that can be undone, newest last. */
  private undoStack: { previous: CardState; logId: number }[] = [];
  private constructor(
    private readonly db: Database,
    readonly notes: Map<string, Note>,
    private scheduler: Scheduler,
    public settings: Settings,
    /** State of cards that exist in cards.json (orphans are left out). */
    private states: Map<string, CardState>,
    private logs: ReviewLogEntry[],
  ) {}

  static async load(db: Database, notes: Note[], now = new Date()): Promise<App> {
    const settings = await getSettings(db);
    const scheduler = await createScheduler(settings.desiredRetention);
    const merged = mergeState(notes, await getAllCardStates(db), () => newFsrsCard(scheduler, now));
    if (merged.created.length) await putCardStates(db, merged.created);
    const logs = await getAllLogs(db);
    return new App(
      db,
      new Map(notes.map((n) => [n.id, n])),
      scheduler,
      settings,
      new Map(merged.active.map((s) => [s.key, s])),
      logs,
    );
  }

  onChange(listener: () => void): void {
    this.listeners.add(listener);
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }

  get allStates(): CardState[] {
    return [...this.states.values()];
  }

  getScheduler(): Scheduler {
    return this.scheduler;
  }

  /** Card states inside the chosen study scope (chapter/page). */
  private scopedStates(): CardState[] {
    const { scope } = this.settings;
    if (!scope) return this.allStates;
    return this.allStates.filter((state) => {
      const note = this.notes.get(state.noteId);
      return note !== undefined && inScope(note, scope);
    });
  }

  queue(now = new Date()): CardState[] {
    return buildQueue(this.scopedStates(), this.logs, { ...this.settings, now });
  }

  nextLearningDue(now = new Date()): Date | null {
    return nextLearningDue(this.scopedStates(), this.settings.mode, now);
  }

  /** Number of ratings given in the current study day (all card states). */
  reviewedToday(now = new Date()): number {
    const start = startOfStudyDay(now);
    return this.logs.filter((log) => log.revlog.reviewTime >= start).length;
  }

  get reviewLogs(): readonly ReviewLogEntry[] {
    return this.logs;
  }

  stats(now = new Date()): Stats {
    return computeStats(this.allStates, this.logs, now);
  }

  async rate(key: string, grade: ButtonGrade, now = new Date()): Promise<void> {
    const current = this.states.get(key);
    if (!current) throw new Error(`Unknown card ${key}`);
    const { card, revlog } = rateCard(this.scheduler, current.fsrs, grade, now);
    const next: CardState = { ...current, fsrs: card };
    const log: ReviewLogEntry = { key, revlog };
    const logId = await saveReview(this.db, next, log);
    this.states.set(key, next);
    this.logs.push({ ...log, id: logId });
    this.undoStack.push({ previous: current, logId });
    if (this.undoStack.length > UNDO_LIMIT) this.undoStack.shift();
    this.emit();
  }

  /**
   * Adds notes that are not in cards.json (street-German phrases) and creates
   * state for their new cards. Existing state is reused (same note id → same key).
   */
  async addNotes(notes: Note[], now = new Date()): Promise<void> {
    if (notes.length === 0) return;
    for (const note of notes) this.notes.set(note.id, note);
    const merged = mergeState(notes, await getAllCardStates(this.db), () => newFsrsCard(this.scheduler, now));
    if (merged.created.length) await putCardStates(this.db, merged.created);
    for (const state of merged.active) this.states.set(state.key, state);
    this.emit();
  }

  /** Removes runtime notes from the app; their stored state is kept (like removed cards.json notes). */
  removeNotes(ids: string[]): void {
    const remove = new Set(ids);
    for (const id of ids) this.notes.delete(id);
    for (const [key, state] of this.states) if (remove.has(state.noteId)) this.states.delete(key);
    this.emit();
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /** Reverts the last rating; returns the card key so the UI can show that card again. */
  async undo(): Promise<string | null> {
    const last = this.undoStack.pop();
    if (!last) return null;
    await undoReview(this.db, last.previous, last.logId);
    this.states.set(last.previous.key, last.previous);
    this.logs = this.logs.filter((log) => log.id !== last.logId);
    this.emit();
    return last.previous.key;
  }

  async setSuspended(key: string, suspended: boolean): Promise<void> {
    const current = this.states.get(key);
    if (!current) return;
    const next = { ...current, suspended };
    await putCardStates(this.db, [next]);
    this.states.set(key, next);
    this.emit();
  }

  async updateSettings(patch: Partial<Settings>): Promise<void> {
    const next = { ...this.settings, ...patch };
    await saveSettings(this.db, next);
    if (next.desiredRetention !== this.settings.desiredRetention) {
      this.scheduler = await createScheduler(next.desiredRetention);
    }
    this.settings = next;
    this.emit();
  }

  /** Exports ALL stored state, including orphaned cards, so nothing is lost. */
  async exportJson(now = new Date()): Promise<string> {
    const cards = await getAllCardStates(this.db);
    const logs = await getAllLogs(this.db);
    return JSON.stringify(createBackup(cards, logs, this.settings, now), null, 2);
  }

  /** Replaces all state with the backup, then re-merges with current cards.json. */
  async importJson(json: string, now = new Date()): Promise<void> {
    const backup = parseBackup(json);
    await replaceAll(this.db, backup);
    const notes = [...this.notes.values()];
    const merged = mergeState(notes, backup.cards, () => newFsrsCard(this.scheduler, now));
    if (merged.created.length) await putCardStates(this.db, merged.created);
    this.settings = backup.settings;
    this.scheduler = await createScheduler(this.settings.desiredRetention);
    this.states = new Map(merged.active.map((s) => [s.key, s]));
    this.logs = await getAllLogs(this.db);
    this.undoStack = [];
    this.emit();
  }
}
