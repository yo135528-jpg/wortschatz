/**
 * Practice results per skill ("gramer:passiv", "adjektiv:none", "verben"), so the app can
 * point the learner to weak spots. Separate from FSRS: drills never change the schedule.
 */
export interface SkillStat {
  right: number;
  wrong: number;
  /** ISO date of the last answer. */
  last: string;
}

export type SkillStats = Record<string, SkillStat>;

/** Only the most recent answers count, so a skill can recover after practice. */
export const WINDOW = 20;
export const MIN_ANSWERS = 5;
export const WEAK_BELOW = 0.8;

export function recordAnswer(stats: SkillStats, skill: string, correct: boolean, now: Date): SkillStats {
  const previous = stats[skill] ?? { right: 0, wrong: 0, last: '' };
  let { right, wrong } = previous;
  if (correct) right++;
  else wrong++;
  // Sliding window: scale the older answers down instead of keeping a full history.
  const total = right + wrong;
  if (total > WINDOW) {
    right = (right / total) * WINDOW;
    wrong = (wrong / total) * WINDOW;
  }
  return { ...stats, [skill]: { right, wrong, last: now.toISOString() } };
}

export function accuracy(stat: SkillStat): number {
  const total = stat.right + stat.wrong;
  return total === 0 ? 1 : stat.right / total;
}

export interface WeakSkill {
  skill: string;
  accuracy: number;
  answers: number;
}

/** Skills with enough answers and a low score, weakest first. */
export function weakSkills(stats: SkillStats, limit = 3): WeakSkill[] {
  return Object.entries(stats)
    .map(([skill, stat]) => ({ skill, accuracy: accuracy(stat), answers: Math.round(stat.right + stat.wrong) }))
    .filter((entry) => entry.answers >= MIN_ANSWERS && entry.accuracy < WEAK_BELOW)
    .sort((a, b) => a.accuracy - b.accuracy || b.answers - a.answers)
    .slice(0, limit);
}
