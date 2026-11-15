/**
 * Appearance: follow the system (default) or force light/dark.
 * A per-device preference, so it lives in localStorage (not in the synced settings).
 * index.html applies the stored value before the first paint to avoid a flash.
 */
export type Theme = 'auto' | 'light' | 'dark';

export const THEME_KEY = 'wortschatz.theme';
export const THEME_LABELS: Record<Theme, string> = { auto: 'Otomatik', light: 'Açık', dark: 'Koyu' };

export function currentTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'auto') delete root.dataset.theme;
  else root.dataset.theme = theme;
}

export function setTheme(theme: Theme): void {
  try {
    if (theme === 'auto') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Private mode: the choice still applies for this visit.
  }
  applyTheme(theme);
}
