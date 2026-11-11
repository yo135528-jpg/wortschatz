import { recordAnswer, type SkillStats } from '../domain/skills';

const KEY = 'wortschatz.skill-stats';

/** Practice results live in localStorage: per device, low stakes, never part of the review state. */
export function readSkillStats(): SkillStats {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? (parsed as SkillStats) : {};
  } catch {
    return {};
  }
}

export function saveSkillAnswer(skill: string, correct: boolean, now = new Date()): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(recordAnswer(readSkillStats(), skill, correct, now)));
  } catch {
    // Private mode: weak spots are just not remembered.
  }
}
