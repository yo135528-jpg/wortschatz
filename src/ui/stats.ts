import type { App } from '../app';
import { h } from './dom';

function tile(label: string, value: string, testId: string): HTMLElement {
  return h(
    'div',
    { class: 'stat' },
    h('div', { class: 'stat-value', 'data-testid': testId }, value),
    h('div', { class: 'stat-label' }, label),
  );
}

export function renderStats(app: App, root: HTMLElement): void {
  const stats = app.stats();
  const retention = stats.retention === null ? '—' : `${Math.round(stats.retention * 100)}%`;
  root.replaceChildren(
    h(
      'div',
      { class: 'stats-grid' },
      tile('Bugün vadesi gelen', String(stats.dueToday), 'stat-due'),
      tile('Yeni', String(stats.newCards), 'stat-new'),
      tile('Öğrenilmiş', String(stats.learned), 'stat-learned'),
      tile('Hatırlama (30 gün)', retention, 'stat-retention'),
      tile('Seri (gün)', `🔥 ${stats.streak}`, 'stat-streak'),
    ),
    h(
      'p',
      { class: 'muted small' },
      `Hatırlama oranı: son 30 günde olgun kartlardaki tekrarların "Again" olmayan payı. Hedef: ${Math.round(
        app.settings.desiredRetention * 100,
      )}%.`,
    ),
  );
}
