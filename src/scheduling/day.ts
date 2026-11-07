/** A new study day starts at 04:00 local time (like Anki), so late-night sessions count for the same day. */
export const DAY_START_HOUR = 4;

export function startOfStudyDay(now: Date): Date {
  const start = new Date(now);
  start.setHours(DAY_START_HOUR, 0, 0, 0);
  if (now < start) start.setDate(start.getDate() - 1);
  return start;
}

export function endOfStudyDay(now: Date): Date {
  const end = startOfStudyDay(now);
  end.setDate(end.getDate() + 1);
  return end;
}

/** Stable "YYYY-MM-DD" label of the study day a moment belongs to. */
export function studyDayLabel(moment: Date): string {
  const start = startOfStudyDay(moment);
  const month = String(start.getMonth() + 1).padStart(2, '0');
  const day = String(start.getDate()).padStart(2, '0');
  return `${start.getFullYear()}-${month}-${day}`;
}
