import { parseInline } from '../domain/grammar';
import {
  REGISTERS,
  REGISTER_HINTS,
  REGISTER_LABELS,
  registerCounts,
  searchPhrases,
  topicPhrases,
  type PhraseHit,
  type RegisterFilter,
  type StreetBlock,
  type StreetPhrase,
  type StreetTopic,
} from '../domain/street';
import { h } from './dom';
import { navigate } from './router';
import { speakButton } from './tts';

/** Renders "**bold**" markers as <strong> using text nodes only (no HTML parsing). */
function rich(value: string): Node {
  const span = h('span');
  for (const segment of parseInline(value)) span.append(segment.bold ? h('strong', {}, segment.text) : segment.text);
  return span;
}

const plain = (value: string) => value.replaceAll('**', '');

/** Adding a phrase to the spaced-repetition cards (provided by main.ts). */
export interface StreetCardActions {
  has(topic: StreetTopic, phrase: StreetPhrase): boolean;
  toggle(topic: StreetTopic, phrase: StreetPhrase): Promise<boolean>;
}

/** "Sokak dili": spoken German by topic, with register filter and phrase search. */
export class StreetView {
  private register: RegisterFilter = 'all';
  private query = '';
  private openId: string | null = null;
  private results: HTMLElement = h('div');
  private readonly byId: Map<string, StreetTopic>;

  constructor(
    private readonly topics: StreetTopic[],
    private readonly root: HTMLElement,
    private readonly cards: StreetCardActions | null = null,
  ) {
    this.byId = new Map(topics.map((topic) => [topic.id, topic]));
    this.render();
  }

  private render(): void {
    const topic = this.openId ? this.byId.get(this.openId) : undefined;
    this.root.replaceChildren(...(topic ? this.renderDetail(topic) : this.renderHome()));
  }

  private open(id: string | null): void {
    navigate({ name: 'street', id });
  }

  /** Shows the list (null) or a topic; called by the router. */
  show(id: string | null): void {
    const next = id && this.byId.has(id) ? id : null;
    const changed = next !== this.openId;
    this.openId = next;
    this.render();
    if (changed) window.scrollTo({ top: 0 });
  }

  // ---------- Home ----------

  private renderHome(): Node[] {
    const total = this.topics.reduce((sum, topic) => sum + topicPhrases(topic).length, 0);
    const hero = h(
      'header',
      { class: 'street-hero' },
      h('h2', {}, 'Sokak dili'),
      h(
        'p',
        {},
        'Kitapta değil, sokakta, kasada, WhatsApp\'ta ve arkadaş arasında nasıl konuşulduğu. ',
        h('strong', {}, `${this.topics.length} konu, ${total} ifade.`),
      ),
    );
    const search = h('input', {
      type: 'search',
      class: 'search',
      placeholder: 'Ara: Bock, pleite, kanka, yorgunum…',
      'aria-label': 'Sokak dilinde ara',
      'data-testid': 'street-search',
      value: this.query,
      oninput: (event: Event) => {
        this.query = (event.target as HTMLInputElement).value;
        this.results.replaceChildren(...this.renderResults());
      },
    });
    this.results = h('div', { 'data-testid': 'street-results' }, ...this.renderResults());
    return [hero, search, this.renderRegisterChips(), this.renderLegend(), this.results];
  }

  private renderRegisterChips(): HTMLElement {
    const all = this.topics.flatMap(topicPhrases);
    const chips = h('div', { class: 'chips street-registers', role: 'group', 'aria-label': 'Üslup' });
    for (const option of ['all', ...REGISTERS] as RegisterFilter[]) {
      const count = option === 'all' ? all.length : all.filter((phrase) => phrase.register === option).length;
      chips.append(
        h(
          'button',
          {
            type: 'button',
            class: `chip ${option === 'all' ? '' : `reg-chip r-${option}`}`,
            'aria-pressed': String(this.register === option),
            'data-testid': `street-register-${option}`,
            onclick: () => {
              this.register = option;
              this.render();
            },
          },
          option === 'all' ? 'Tümü ' : `${REGISTER_LABELS[option]} `,
          h('span', { class: 'chip-count' }, String(count)),
        ),
      );
    }
    return chips;
  }

  private renderLegend(): HTMLElement {
    return h(
      'details',
      { class: 'street-legend' },
      h('summary', {}, 'Etiketler ne anlama geliyor?'),
      h(
        'ul',
        {},
        ...REGISTERS.map((register) =>
          h('li', {}, h('span', { class: `tag r-${register}` }, REGISTER_LABELS[register]), ' ', REGISTER_HINTS[register]),
        ),
      ),
    );
  }

  private renderResults(): Node[] {
    const filtering = this.query.trim() !== '' || this.register !== 'all';
    return filtering ? this.renderHits() : [this.renderTopicGrid()];
  }

  private renderTopicGrid(): HTMLElement {
    return h(
      'ul',
      { class: 'street-grid' },
      ...this.topics.map((topic) => {
        const counts = registerCounts(topic);
        const count = topicPhrases(topic).length;
        return h(
          'li',
          {},
          h(
            'button',
            {
              type: 'button',
              class: 'street-card',
              'data-testid': 'street-topic',
              'data-id': topic.id,
              onclick: () => this.open(topic.id),
            },
            h('span', { class: 'street-card-icon', 'aria-hidden': 'true' }, topic.icon),
            h('span', { class: 'street-card-title' }, topic.titleTr),
            h('span', { class: 'street-card-sub' }, topic.titleDe),
            h(
              'span',
              { class: 'street-card-foot' },
              h('span', { class: 'muted' }, `${count} ifade`),
              h(
                'span',
                { class: 'reg-dots', 'aria-hidden': 'true' },
                ...REGISTERS.filter((register) => counts[register]).map((register) =>
                  h('span', { class: `reg-dot r-${register}`, title: REGISTER_LABELS[register] }),
                ),
              ),
            ),
          ),
        );
      }),
    );
  }

  private renderHits(): Node[] {
    const hits = searchPhrases(this.topics, { register: this.register, query: this.query });
    if (hits.length === 0) return [h('p', { class: 'empty muted' }, 'Sonuç yok.')];
    const groups = new Map<StreetTopic, PhraseHit[]>();
    for (const hit of hits) groups.set(hit.topic, [...(groups.get(hit.topic) ?? []), hit]);
    return [
      h('p', { class: 'muted small street-hit-count' }, `${hits.length} ifade bulundu`),
      ...[...groups].map(([topic, items]) =>
        h(
          'section',
          { class: 'street-hit-group' },
          h(
            'button',
            { type: 'button', class: 'street-hit-topic', onclick: () => this.open(topic.id) },
            `${topic.icon} ${topic.titleTr} →`,
          ),
          h('ul', { class: 'phrase-list' }, ...items.map((hit) => this.renderPhrase(hit.phrase, hit.topic))),
        ),
      ),
    ];
  }

  // ---------- Detail ----------

  private renderDetail(topic: StreetTopic): Node[] {
    const back = h(
      'button',
      { type: 'button', class: 'grammar-back', 'data-testid': 'street-back', onclick: () => this.open(null) },
      '← Sokak dili',
    );
    const related = topic.related
      .map((id) => this.byId.get(id))
      .filter((item): item is StreetTopic => item !== undefined);
    return [
      back,
      h(
        'article',
        { class: 'street-detail', 'data-testid': 'street-detail', 'data-id': topic.id },
        h(
          'header',
          { class: 'street-head' },
          h('span', { class: 'street-head-icon', 'aria-hidden': 'true' }, topic.icon),
          h('h2', { class: 'grammar-title' }, topic.titleTr),
          h('p', { class: 'grammar-subtitle muted' }, topic.titleDe),
          h('p', { class: 'grammar-summary' }, rich(topic.intro)),
        ),
        ...topic.blocks.map((block) => this.renderBlock(block, topic)),
        related.length
          ? h(
              'section',
              { class: 'grammar-related' },
              h('h3', {}, 'İlgili konular'),
              h(
                'div',
                { class: 'chips' },
                ...related.map((item) =>
                  h('button', { type: 'button', class: 'chip', onclick: () => this.open(item.id) }, `${item.icon} ${item.titleTr}`),
                ),
              ),
            )
          : null,
      ),
    ];
  }

  private renderBlock(block: StreetBlock, topic: StreetTopic): HTMLElement {
    switch (block.type) {
      case 'text':
        return h('p', { class: 'grammar-text' }, rich(block.text));
      case 'tip':
        return h('p', { class: 'grammar-callout grammar-tip' }, h('strong', {}, '💡 '), rich(block.text));
      case 'warning':
        return h('p', { class: 'grammar-callout grammar-warning' }, h('strong', {}, '⚠️ '), rich(block.text));
      case 'phrases':
        return h(
          'section',
          { class: 'phrase-section' },
          block.heading ? h('h3', { class: 'phrase-heading' }, block.heading) : null,
          h('ul', { class: 'phrase-list' }, ...block.items.map((item) => this.renderPhrase(item, topic))),
        );
      case 'dialogue':
        return h(
          'section',
          { class: 'dialogue' },
          h('h3', { class: 'phrase-heading' }, `🎬 ${block.title}`),
          ...block.lines.map((line) =>
            h(
              'div',
              { class: `bubble ${line.speaker === 'Du' ? 'bubble-me' : ''}` },
              h('span', { class: 'bubble-speaker' }, line.speaker === 'Du' ? 'Sen' : line.speaker),
              h('span', { class: 'bubble-de' }, rich(line.de), speakButton(plain(line.de))),
              h('span', { class: 'bubble-tr' }, line.tr),
            ),
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

  private renderPhrase(phrase: StreetPhrase, topic: StreetTopic): HTMLElement {
    return h(
      'li',
      { class: `phrase r-${phrase.register}`, 'data-testid': 'street-phrase' },
      h(
        'div',
        { class: 'phrase-top' },
        h('span', { class: 'phrase-de' }, rich(phrase.de)),
        speakButton(plain(phrase.de)),
        h(
          'span',
          { class: `tag r-${phrase.register}` },
          phrase.region ? `${REGISTER_LABELS[phrase.register]} · ${phrase.region}` : REGISTER_LABELS[phrase.register],
        ),
      ),
      h('div', { class: 'phrase-tr' }, phrase.tr),
      phrase.standard ? h('div', { class: 'phrase-standard' }, h('span', { class: 'muted' }, 'Yazıda: '), phrase.standard) : null,
      phrase.example
        ? h(
            'div',
            { class: 'phrase-example' },
            h('div', { class: 'example-de' }, rich(phrase.example.de), speakButton(plain(phrase.example.de))),
            h('div', { class: 'example-tr' }, phrase.example.tr),
          )
        : null,
      phrase.note ? h('div', { class: 'phrase-note' }, rich(phrase.note)) : null,
      this.cardButton(phrase, topic),
    );
  }

  private cardButton(phrase: StreetPhrase, topic: StreetTopic): HTMLElement | null {
    const cards = this.cards;
    if (!cards) return null;
    const label = (added: boolean) => (added ? '✓ Kartlarda' : '+ Kartlara ekle');
    const button = h(
      'button',
      {
        type: 'button',
        class: `add-card ${cards.has(topic, phrase) ? 'is-added' : ''}`,
        'data-testid': 'add-card',
        onclick: async () => {
          button.disabled = true;
          const added = await cards.toggle(topic, phrase);
          button.textContent = label(added);
          button.classList.toggle('is-added', added);
          button.disabled = false;
        },
      },
      label(cards.has(topic, phrase)),
    );
    return button;
  }
}
