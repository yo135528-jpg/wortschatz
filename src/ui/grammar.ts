import {
  CATEGORY_LABELS,
  LEVELS,
  filterTopics,
  groupByLevel,
  parseInline,
  type GrammarBlock,
  type GrammarTopic,
  type LevelFilter,
} from '../domain/grammar';
import { h } from './dom';

/** Renders "**bold**" markers as <strong> using text nodes only (no HTML parsing). */
function rich(value: string): Node {
  const span = h('span');
  for (const segment of parseInline(value)) span.append(segment.bold ? h('strong', {}, segment.text) : segment.text);
  return span;
}

/** Grammar reference: topic list with level filter and search, plus a detail page per topic. */
export class GrammarView {
  private level: LevelFilter = 'all';
  private query = '';
  private openId: string | null = null;
  /** Topic list container; re-rendered on search without rebuilding the search input. */
  private list: HTMLElement = h('div');
  private readonly byId: Map<string, GrammarTopic>;

  constructor(
    private readonly topics: GrammarTopic[],
    private readonly root: HTMLElement,
  ) {
    this.byId = new Map(topics.map((topic) => [topic.id, topic]));
    this.render();
  }

  private render(): void {
    const topic = this.openId ? this.byId.get(this.openId) : undefined;
    this.root.replaceChildren(...(topic ? this.renderDetail(topic) : this.renderList()));
  }

  private open(id: string | null): void {
    this.openId = id;
    this.render();
    window.scrollTo({ top: 0 });
  }

  // ---------- List ----------

  private renderList(): Node[] {
    const search = h('input', {
      type: 'search',
      class: 'search',
      placeholder: 'Ara: Dativ, Passiv, obwohl…',
      'aria-label': 'Gramer ara',
      'data-testid': 'grammar-search',
      value: this.query,
      oninput: (event: Event) => {
        this.query = (event.target as HTMLInputElement).value;
        this.list.replaceChildren(...this.renderGroups());
      },
    });
    this.list = h('div', { class: 'grammar-groups', 'data-testid': 'grammar-list' }, ...this.renderGroups());
    return [search, this.renderLevelChips(), this.list];
  }

  private renderLevelChips(): HTMLElement {
    const options: LevelFilter[] = ['all', ...LEVELS];
    const chips = h('div', { class: 'chips grammar-levels', role: 'group', 'aria-label': 'Seviye' });
    for (const option of options) {
      const count = option === 'all' ? this.topics.length : this.topics.filter((t) => t.level === option).length;
      chips.append(
        h(
          'button',
          {
            type: 'button',
            class: 'chip',
            'aria-pressed': String(this.level === option),
            'data-testid': `grammar-level-${option}`,
            onclick: () => {
              this.level = option;
              this.render();
            },
          },
          option === 'all' ? 'Tümü ' : `${option} `,
          h('span', { class: 'chip-count' }, String(count)),
        ),
      );
    }
    return chips;
  }

  private renderGroups(): Node[] {
    const groups = groupByLevel(filterTopics(this.topics, { level: this.level, query: this.query }));
    if (groups.length === 0) return [h('p', { class: 'empty muted' }, 'Sonuç yok.')];
    return groups.map((group) =>
      h(
        'section',
        { class: 'grammar-group' },
        h('h2', { class: 'grammar-group-title' }, h('span', { class: `level level-${group.level}` }, group.level)),
        h(
          'ul',
          { class: 'grammar-list' },
          ...group.topics.map((topic) =>
            h(
              'li',
              {},
              h(
                'button',
                {
                  type: 'button',
                  class: 'grammar-item',
                  'data-testid': 'grammar-topic',
                  'data-id': topic.id,
                  'data-level': topic.level,
                  onclick: () => this.open(topic.id),
                },
                h('span', { class: 'grammar-item-title' }, topic.titleDe),
                h('span', { class: 'grammar-item-sub muted' }, topic.titleTr),
                h('span', { class: 'grammar-item-cat' }, CATEGORY_LABELS[topic.category]),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ---------- Detail ----------

  private renderDetail(topic: GrammarTopic): Node[] {
    const back = h(
      'button',
      { type: 'button', class: 'grammar-back', 'data-testid': 'grammar-back', onclick: () => this.open(null) },
      '← Gramer',
    );
    const header = h(
      'header',
      { class: 'grammar-head' },
      h(
        'div',
        { class: 'grammar-meta' },
        h('span', { class: `level level-${topic.level}` }, topic.level),
        h('span', { class: 'muted small' }, CATEGORY_LABELS[topic.category]),
      ),
      h('h2', { class: 'grammar-title' }, topic.titleDe),
      h('p', { class: 'grammar-subtitle muted' }, topic.titleTr),
      h('p', { class: 'grammar-summary' }, rich(topic.summary)),
      topic.book ? h('p', { class: 'grammar-book small' }, `📘 Kitapta: ${topic.book}`) : null,
    );
    const related = topic.related
      .map((id) => this.byId.get(id))
      .filter((item): item is GrammarTopic => item !== undefined);
    return [
      back,
      h(
        'article',
        { class: 'grammar-detail', 'data-testid': 'grammar-detail', 'data-id': topic.id },
        header,
        ...topic.blocks.map((block) => this.renderBlock(block)),
        related.length
          ? h(
              'section',
              { class: 'grammar-related' },
              h('h3', {}, 'İlgili konular'),
              h(
                'div',
                { class: 'chips' },
                ...related.map((item) =>
                  h(
                    'button',
                    { type: 'button', class: 'chip', onclick: () => this.open(item.id) },
                    `${item.level} · ${item.titleDe}`,
                  ),
                ),
              ),
            )
          : null,
      ),
    ];
  }

  private renderBlock(block: GrammarBlock): HTMLElement {
    switch (block.type) {
      case 'text':
        return h('p', { class: 'grammar-text' }, rich(block.text));
      case 'tip':
        return h('p', { class: 'grammar-callout grammar-tip' }, h('strong', {}, '💡 '), rich(block.text));
      case 'warning':
        return h('p', { class: 'grammar-callout grammar-warning' }, h('strong', {}, '⚠️ '), rich(block.text));
      case 'examples':
        return h(
          'ul',
          { class: 'examples grammar-examples' },
          ...block.items.map((item) =>
            h('li', {}, h('div', { class: 'example-de' }, rich(item.de)), h('div', { class: 'example-tr' }, item.tr)),
          ),
        );
      case 'table':
        return h(
          'div',
          { class: 'grammar-table-wrap' },
          h(
            'table',
            { class: 'grammar-table' },
            block.caption ? h('caption', {}, block.caption) : null,
            h('thead', {}, h('tr', {}, ...block.head.map((cell) => h('th', { scope: 'col' }, rich(cell))))),
            h('tbody', {}, ...block.rows.map((row) => h('tr', {}, ...row.map((cell) => h('td', {}, rich(cell)))))),
          ),
        );
    }
  }
}
