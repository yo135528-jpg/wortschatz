import type { App } from '../app';
import { chapterOf } from '../domain/scope';
import { activityCalendar, dueForecast, groupProgress, type DayCount } from '../scheduling/stats';
import { h } from './dom';

function tile(label: string, value: string, testId: string): HTMLElement {
  return h(
    'div',
    { class: 'stat' },
    h('div', { class: 'stat-value', 'data-testid': testId }, value),
    h('div', { class: 'stat-label' }, label),
  );
}

const dateLabel = (label: string, options: Intl.DateTimeFormatOptions) =>
  new Date(`${label}T12:00:00`).toLocaleDateString('tr-TR', options);

/** Detail line under a chart: shows the hovered/tapped value (works on touch too). */
function detailLine(initial: string): { element: HTMLElement; set: (text: string | null) => void } {
  const element = h('p', { class: 'chart-detail', 'aria-live': 'polite' }, initial);
  return { element, set: (text) => (element.textContent = text ?? initial) };
}

/** Calendar heatmap: one hue, light → dark, 5 steps relative to the busiest day. */
function heatmap(days: DayCount[]): HTMLElement {
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const activeDays = days.filter((d) => d.count > 0).length;
  const detail = detailLine(`Son ${Math.ceil(days.length / 7)} hafta: ${total} tekrar, ${activeDays} gün çalıştın.`);
  const level = (count: number) => (count === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4)));
  const describe = (d: DayCount) => `${dateLabel(d.label, { day: 'numeric', month: 'long', weekday: 'short' })}: ${d.count} tekrar`;
  return h(
    'section',
    { class: 'panel chart', 'data-testid': 'chart-heatmap' },
    h('h2', {}, 'Çalışma takvimi'),
    h(
      'div',
      { class: 'heatmap', role: 'img', 'aria-label': `Çalışma takvimi. ${detail.element.textContent}` },
      ...days.map((d) =>
        h('span', {
          class: `heat heat-${level(d.count)}`,
          title: describe(d),
          tabindex: 0,
          onmouseenter: () => detail.set(describe(d)),
          onfocus: () => detail.set(describe(d)),
          onclick: () => detail.set(describe(d)),
          onmouseleave: () => detail.set(null),
        }),
      ),
    ),
    h(
      'div',
      { class: 'heat-legend', 'aria-hidden': 'true' },
      'Az ',
      ...[0, 1, 2, 3, 4].map((n) => h('span', { class: `heat heat-${n}` })),
      ' Çok',
    ),
    detail.element,
  );
}

/** Next 7 days: one series, so no legend; values via the detail line. */
function forecastChart(days: DayCount[]): HTMLElement {
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((sum, d) => sum + d.count, 0);
  const name = (d: DayCount, i: number) =>
    i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : dateLabel(d.label, { weekday: 'short' });
  const detail = detailLine(`Bugün ${days[0]?.count ?? 0} kart · 7 günde toplam ${total}.`);
  return h(
    'section',
    { class: 'panel chart', 'data-testid': 'chart-forecast' },
    h('h2', {}, 'Önümüzdeki 7 gün'),
    h(
      'div',
      { class: 'bars', role: 'img', 'aria-label': days.map((d, i) => `${name(d, i)} ${d.count}`).join(', ') },
      ...days.map((d, i) => {
        const text = `${name(d, i)}: ${d.count} kart tekrar edilecek`;
        return h(
          'div',
          {
            class: 'bar-col',
            title: text,
            tabindex: 0,
            onmouseenter: () => detail.set(text),
            onfocus: () => detail.set(text),
            onclick: () => detail.set(text),
            onmouseleave: () => detail.set(null),
          },
          h(
            'div',
            { class: 'bar-track' },
            h('div', { class: 'bar', style: `height:${d.count === 0 ? 0 : Math.max(4, (d.count / max) * 100)}%` }),
          ),
          h('span', { class: 'bar-label' }, name(d, i)),
        );
      }),
    ),
    detail.element,
  );
}

/** Per chapter: started vs. settled words, as a two-segment meter with a legend. */
function chapterChart(app: App): HTMLElement {
  const groups = groupProgress(
    new Map([...app.notes.values()].map((note) => [note.id, chapterOf(note.source)])),
    app.allStates,
  );
  return h(
    'section',
    { class: 'panel chart', 'data-testid': 'chart-chapters' },
    h('h2', {}, 'Bölümlere göre ilerleme'),
    h(
      'div',
      { class: 'meter-legend' },
      h('span', {}, h('i', { class: 'swatch swatch-mature' }), 'Oturmuş'),
      h('span', {}, h('i', { class: 'swatch swatch-started' }), 'Başlanmış'),
    ),
    h(
      'ul',
      { class: 'meters' },
      ...groups.map((group) => {
        const mature = (group.mature / group.total) * 100;
        const started = ((group.started - group.mature) / group.total) * 100;
        return h(
          'li',
          { class: 'meter-row' },
          h(
            'div',
            { class: 'meter-head' },
            h('strong', {}, group.label),
            h('span', { class: 'muted small' }, `${group.started} / ${group.total} kelime · ${group.mature} oturmuş`),
          ),
          h(
            'div',
            { class: 'meter', title: `${group.label}: ${group.started} başlanmış, ${group.mature} oturmuş, toplam ${group.total}` },
            mature > 0 ? h('span', { class: 'meter-mature', style: `width:${mature}%` }) : null,
            started > 0 ? h('span', { class: 'meter-started', style: `width:${started}%` }) : null,
          ),
        );
      }),
    ),
  );
}

export function renderStats(app: App, root: HTMLElement): void {
  const now = new Date();
  const stats = app.stats(now);
  const retention = stats.retention === null ? '—' : `${Math.round(stats.retention * 100)}%`;
  root.replaceChildren(
    h(
      'div',
      { class: 'stats-grid' },
      tile('Bugün vadesi gelen', String(stats.dueToday), 'stat-due'),
      tile('Yeni kart', String(stats.newCards), 'stat-new'),
      tile('Öğrenilmiş kart', String(stats.learned), 'stat-learned'),
      tile('Hatırlama (30 gün)', retention, 'stat-retention'),
      tile('Seri (gün)', `🔥 ${stats.streak}`, 'stat-streak'),
      tile('Toplam tekrar', String(app.reviewLogs.length), 'stat-total'),
    ),
    forecastChart(dueForecast(app.allStates, now)),
    heatmap(activityCalendar([...app.reviewLogs], now)),
    chapterChart(app),
    h(
      'p',
      { class: 'muted small' },
      `Hatırlama oranı: son 30 günde olgun kartlardaki tekrarların „Tekrar“ denmeyen payı. Hedef: ${Math.round(
        app.settings.desiredRetention * 100,
      )}%. Oturmuş: kartın hafızada en az 3 hafta kalacağı tahmin ediliyor.`,
    ),
  );
}
