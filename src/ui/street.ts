import { parseInline } from '../domain/grammar';
import {
  REGISTERS,
  REGISTER_HINTS,
  REGISTER_LABELS,
  STREET_GROUPS,
  STREET_GROUP_LABELS,
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
import { icon } from './icons';
import { navigate } from './router';
import { speakButton, speakGermanToEnd, stopGerman } from './tts';

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
        ' Her konu bir ders gibi: açıklama, örnekler, diyaloglar ve sonunda kendini dene.',
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
      'div',
      { class: 'street-groups' },
      ...STREET_GROUPS.map((group) => {
        const topics = this.topics.filter((topic) => topic.group === group);
        if (topics.length === 0) return null;
        return h(
          'section',
          { class: 'street-group', 'data-testid': 'street-group' },
          h('h3', { class: 'section-title' }, STREET_GROUP_LABELS[group]),
          this.renderTopicList(topics),
        );
      }),
    );
  }

  private renderTopicList(topics: StreetTopic[]): HTMLElement {
    return h(
      'ul',
      { class: 'street-grid' },
      ...topics.map((topic) => {
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
        return h('p', { class: 'grammar-callout grammar-tip' }, icon('bulb'), rich(block.text));
      case 'warning':
        return h('p', { class: 'grammar-callout grammar-warning' }, icon('warning'), rich(block.text));
      case 'heading':
        return h('h3', { class: 'street-lesson-heading' }, rich(block.text));
      case 'check':
        return this.renderCheck(block);
      case 'phrases':
        return h(
          'section',
          { class: 'phrase-section' },
          block.heading ? h('h3', { class: 'phrase-heading' }, block.heading) : null,
          h('ul', { class: 'phrase-list' }, ...block.items.map((item) => this.renderPhrase(item, topic))),
        );
      case 'dialogue':
        return this.renderDialogue(block);
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

  /** A short scene: listen to all lines in a row, or play "your" lines yourself (role play). */
  private renderDialogue(block: Extract<StreetBlock, { type: 'dialogue' }>): HTMLElement {
    let playing = false;
    const bubbles = block.lines.map((line) => {
      const mine = line.speaker === 'Du';
      const bubble = h(
        'div',
        {
          class: `bubble ${mine ? 'bubble-me' : ''}`,
          onclick: () => {
            if (mine && section.classList.contains('is-roleplay')) bubble.classList.toggle('is-revealed');
          },
        },
        h('span', { class: 'bubble-speaker' }, mine ? 'Sen' : line.speaker),
        h('span', { class: 'bubble-de' }, rich(line.de), speakButton(plain(line.de))),
        h('span', { class: 'bubble-tr' }, line.tr),
        mine ? h('span', { class: 'bubble-hint muted small' }, 'Almancasını söyle, sonra dokun') : null,
      );
      return bubble;
    });
    const stop = () => {
      playing = false;
      stopGerman();
      playButton.replaceChildren(icon('play'), 'Dinle');
      bubbles.forEach((bubble) => bubble.classList.remove('is-playing'));
    };
    const playButton: HTMLButtonElement = h(
      'button',
      {
        type: 'button',
        class: 'dialogue-action',
        'data-testid': 'dialogue-play',
        onclick: async () => {
          if (playing) return stop();
          playing = true;
          playButton.replaceChildren(icon('pause'), 'Durdur');
          for (const [index, line] of block.lines.entries()) {
            if (!playing) return;
            bubbles.forEach((bubble, i) => bubble.classList.toggle('is-playing', i === index));
            bubbles[index]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            await speakGermanToEnd(plain(line.de));
            await new Promise((resolve) => setTimeout(resolve, 350));
          }
          stop();
        },
      },
      icon('play'),
      'Dinle',
    );
    const hasMine = block.lines.some((line) => line.speaker === 'Du');
    const roleButton = hasMine
      ? h(
          'button',
          {
            type: 'button',
            class: 'dialogue-action',
            'aria-pressed': 'false',
            'data-testid': 'dialogue-roleplay',
            onclick: () => {
              const on = section.classList.toggle('is-roleplay');
              roleButton!.setAttribute('aria-pressed', String(on));
              bubbles.forEach((bubble) => bubble.classList.remove('is-revealed'));
            },
          },
          icon('mic'),
          'Rol yap',
        )
      : null;
    const section = h(
      'section',
      { class: 'dialogue', 'data-testid': 'dialogue' },
      h(
        'div',
        { class: 'dialogue-head' },
        h('h3', { class: 'phrase-heading' }, icon('chat'), block.title),
        h('div', { class: 'dialogue-actions' }, playButton, roleButton),
      ),
      ...bubbles,
    );
    return section;
  }

  /** Self-check: one tap shows right/wrong and the explanation. */
  private renderCheck(block: Extract<StreetBlock, { type: 'check' }>): HTMLElement {
    const result = h('p', { class: 'street-check-result', hidden: true });
    const buttons = block.options.map((option) =>
      h(
        'button',
        {
          type: 'button',
          class: 'choice street-check-option',
          'data-testid': 'street-check-option',
          onclick: () => {
            const right = option === block.answer;
            buttons.forEach((button, i) => {
              button.disabled = true;
              if (block.options[i] === block.answer) button.classList.add('is-answer');
            });
            if (!right) buttons[block.options.indexOf(option)]?.classList.add('is-wrong-pick');
            result.hidden = false;
            result.className = `street-check-result ${right ? 'is-correct' : 'is-wrong'}`;
            result.replaceChildren(h('strong', {}, right ? 'Doğru! ' : 'Tam değil. '), block.explain ? rich(block.explain) : '');
          },
        },
        rich(option),
      ),
    );
    return h(
      'section',
      { class: 'street-check', 'data-testid': 'street-check' },
      h('p', { class: 'street-check-kicker' }, icon('bulb'), 'Kendini dene'),
      h('p', { class: 'street-check-question' }, rich(block.question)),
      h('div', { class: 'choices choices-list' }, ...buttons),
      result,
    );
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
