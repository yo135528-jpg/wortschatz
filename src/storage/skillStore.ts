import { recordAnswer, type SkillStats } from '../domain/skills';

const KEY = 'wortschatz.skill-stats';

/**
 * Practice results live in localStorage (low stakes, never part of the FSRS state).
 * They are included in backups and device sync, so weak spots follow the learner.
 */
export function readSkillStats(): SkillStats {
  if (typeof localStorage === 'undefined') return {};
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? (parsed as SkillStats) : {};
  } catch {
    return {};
  }
}

/** Replaces the stored results (backup import, device sync). */
export function writeSkillStats(stats: SkillStats): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(stats));
  } catch {
    // Private mode: nothing to restore into.
  }
}

export function saveSkillAnswer(skill: string, correct: boolean, now = new Date()): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(recordAnswer(readSkillStats(), skill, correct, now)));
  } catch {
    // Private mode: weak spots are just not remembered.
  }
}
