import type { App } from '../app';
import { h } from './dom';
import { icon, type IconName } from './icons';
import { href, type Route } from './router';
import { weakSpotsPanel } from './weakSpots';

export interface StudyItem {
  route: Route;
  icon: IconName;
  title: string;
  description: string;
  /** Short status text, e.g. "12 kart". */
  badge?: (app: App) => string | null;
  testId: string;
}

/** "Çalış" hub: the spaced-repetition review plus practice drills. */
export class StudyView {
  constructor(
    private readonly app: App,
    private readonly root: HTMLElement,
    private readonly items: StudyItem[],
  ) {}

  refresh(): void {
    const due = this.app.queue().length;
    const review = h(
      'a',
      { class: 'study-hero', href: href({ name: 'review' }), 'data-testid': 'study-review' },
      h('span', { class: 'study-hero-icon' }, icon('cards')),
      h(
        'span',
        { class: 'study-hero-text' },
        h('span', { class: 'study-hero-title' }, 'Kart tekrarı'),
        h('span', { class: 'study-hero-sub' }, 'Aralıklı tekrar (FSRS): her kartı unutmak üzereyken sorar.'),
      ),
      h('span', { class: 'study-hero-badge' }, due ? `${due} kart` : icon('check')),
    );
    this.root.replaceChildren(
      review,
      weakSpotsPanel(),
      h('h2', { class: 'section-title' }, 'Antrenmanlar'),
      h(
        'p',
        { class: 'muted small section-sub' },
        'Antrenmanlar tekrar takvimini etkilemez; istediğin kadar çalışabilirsin.',
      ),
      h(
        'ul',
        { class: 'study-grid' },
        ...this.items.map((item) => {
          const badge = item.badge?.(this.app) ?? null;
          return h(
            'li',
            {},
            h(
              'a',
              { class: 'study-card', href: href(item.route), 'data-testid': item.testId },
              h('span', { class: 'study-card-icon' }, icon(item.icon)),
              h('span', { class: 'study-card-title' }, item.title),
              h('span', { class: 'study-card-sub' }, item.description),
              badge ? h('span', { class: 'study-card-badge' }, badge) : null,
            ),
          );
        }),
      ),
    );
  }
}
