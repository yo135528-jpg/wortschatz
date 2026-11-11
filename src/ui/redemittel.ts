import { searchRedemittel, SKILL_LABELS, type RedemittelGroup, type RedemittelItem } from '../domain/redemittel';
import { h } from './dom';
import { href, navigate } from './router';
import { speakButton } from './tts';

/** "Kalıplar" tab: Redemittel grouped by what the learner wants to do. */
export class RedemittelView {
  private openId: string | null = null;
  private query = '';
  private results: HTMLElement = h('div');
  private readonly byId: Map<string, RedemittelGroup>;

  constructor(
    private readonly groups: RedemittelGroup[],
    private readonly root: HTMLElement,
  ) {
    this.byId = new Map(groups.map((group) => [group.id, group]));
  }

  /** Shows the list (null) or one group; called by the router. */
  show(id: string | null): void {
    const next = id && this.byId.has(id) ? id : null;
    const changed = next !== this.openId;
    this.openId = next;
    const group = next ? this.byId.get(next) : undefined;
    this.root.replaceChildren(...(group ? this.renderDetail(group) : this.renderHome()));
    if (changed) window.scrollTo({ top: 0 });
  }

  private renderHome(): Node[] {
    const total = this.groups.reduce((sum, group) => sum + group.items.length, 0);
    const search = h('input', {
      type: 'search',
      class: 'search',
      placeholder: 'Ara: Meinung, bence, vorschlagen…',
      'aria-label': 'Kalıplarda ara',
      'data-testid': 'redemittel-search',
      value: this.query,
      oninput: (event: Event) => {
        this.query = (event.target as HTMLInputElement).value;
        this.results.replaceChildren(...this.renderResults());
      },
    });
    this.results = h('div', { 'data-testid': 'redemittel-results' }, ...this.renderResults());
    return [
      h(
        'header',
        { class: 'street-hero' },
        h('h2', {}, 'Kalıplar'),
        h(
          'p',
          {},
          'Konuşurken ve yazarken hazır kullanacağın B2 cümle kalıpları (Redemittel), ne yapmak istediğine göre. ',
          h('strong', {}, `${this.groups.length} konu, ${total} kalıp.`),
        ),
        h('a', { class: 'button', href: href({ name: 'drill', kind: 'kalip' }), 'data-testid': 'redemittel-drill' }, 'Kalıpları çalış →'),
      ),
      search,
      this.results,
    ];
  }

  private renderResults(): Node[] {
    if (this.query.trim() === '') return [this.renderGrid()];
    const hits = searchRedemittel(this.groups, this.query);
    if (hits.length === 0) return [h('p', { class: 'empty muted' }, 'Sonuç yok.')];
    return [
      h('p', { class: 'muted small street-hit-count' }, `${hits.length} kalıp bulundu`),
      h('ul', { class: 'phrase-list' }, ...hits.map((hit) => this.renderItem(hit.item, hit.group))),
    ];
  }

  private renderGrid(): HTMLElement {
    return h(
      'ul',
      { class: 'street-grid' },
      ...this.groups.map((group) =>
        h(
          'li',
          {},
          h(
            'button',
            {
              type: 'button',
              class: 'street-card',
              'data-testid': 'redemittel-group',
              'data-id': group.id,
              onclick: () => navigate({ name: 'phrases', id: group.id }),
            },
            h('span', { class: 'street-card-icon', 'aria-hidden': 'true' }, group.icon),
            h('span', { class: 'street-card-title' }, group.titleTr),
            h('span', { class: 'street-card-sub' }, group.titleDe),
            h(
              'span',
              { class: 'street-card-foot' },
              h('span', { class: 'muted' }, `${group.items.length} kalıp`),
              h('span', { class: 'muted' }, SKILL_LABELS[group.skill]),
            ),
          ),
        ),
      ),
    );
  }

  private renderDetail(group: RedemittelGroup): Node[] {
    return [
      h(
        'button',
        {
          type: 'button',
          class: 'grammar-back',
          'data-testid': 'redemittel-back',
          onclick: () => navigate({ name: 'phrases', id: null }),
        },
        '← Kalıplar',
      ),
      h(
        'article',
        { class: 'street-detail', 'data-testid': 'redemittel-detail', 'data-id': group.id },
        h(
          'header',
          { class: 'street-head' },
          h('span', { class: 'street-head-icon', 'aria-hidden': 'true' }, group.icon),
          h('h2', { class: 'grammar-title' }, group.titleTr),
          h('p', { class: 'grammar-subtitle muted' }, `${group.titleDe} · ${SKILL_LABELS[group.skill]}`),
          h('p', { class: 'grammar-summary' }, group.summaryTr),
        ),
        h('ul', { class: 'phrase-list' }, ...group.items.map((item) => this.renderItem(item, null))),
      ),
    ];
  }

  /** One phrase; in search results it also links to its group. */
  private renderItem(item: RedemittelItem, group: RedemittelGroup | null): HTMLElement {
    return h(
      'li',
      { class: 'phrase r-locker', 'data-testid': 'redemittel-item' },
      h('div', { class: 'phrase-top' }, h('span', { class: 'phrase-de' }, item.de), speakButton(item.example.de)),
      h('div', { class: 'phrase-tr' }, item.tr),
      h(
        'div',
        { class: 'phrase-example' },
        h('div', { class: 'example-de' }, item.example.de),
        h('div', { class: 'example-tr' }, item.example.tr),
      ),
      item.note ? h('div', { class: 'phrase-note' }, item.note) : null,
      group
        ? h('a', { class: 'muted small', href: href({ name: 'phrases', id: group.id }) }, `${group.icon} ${group.titleTr} →`)
        : null,
    );
  }
}
