/**
 * Deterministic "of the day" picks: the same item all day long, a different one tomorrow,
 * without storing anything.
 */
export function dayNumber(label: string): number {
  // label is "YYYY-MM-DD" (study day); UTC parsing keeps it timezone-independent.
  return Math.floor(Date.parse(`${label}T00:00:00Z`) / 86_400_000);
}

export function pickOfDay<T>(items: readonly T[], label: string, salt = 0): T | null {
  if (items.length === 0) return null;
  // A large odd multiplier spreads consecutive days across the list instead of walking it in order.
  const index = Math.abs((dayNumber(label) + salt) * 2_654_435_761) % items.length;
  return items[index] ?? null;
}
