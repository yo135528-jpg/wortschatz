import type { App } from '../app';
import { loadGrammar, loadRedemittel, loadStreet } from '../content';
import { buildHeadword, headwordToString, typeLabelTr } from '../domain/format';
import { filterTopics } from '../domain/grammar';
import { searchRedemittel } from '../domain/redemittel';
import { searchPhrases } from '../domain/street';
import { buildRows, filterRows } from './browseModel';
import { h } from './dom';
import { href, replaceRoute } from './router';

const LIMIT = 8;

/** One search box over words, grammar, street German and Redemittel. */
export class SearchView {
  private readonly input: HTMLInputElement;
  private readonly results: HTMLElement;
  private request = 0;

  constructor(
    private readonly app: App,
    root: HTMLElement,
  ) {
    this.input = h('input', {
      type: 'search',
      class: 'search',
      placeholder: 'Kelime, gramer konusu, kalıp, sokak ifadesi…',
      'aria-label': 'Her şeyde ara',
      'data-testid': 'search-all',
      oninput: () => {
        replaceRoute({ name: 'search', query: this.input.value });
        void this.run(this.input.value);
      },
    });
    this.results = h('div', { class: 'search-results', 'data-testid': 'search-results' });
    root.append(h('h2', { class: 'section-title' }, '🔎 Her şeyde ara'), this.input, this.results);
  }

  show(query: string): void {
    if (this.input.value !== query) this.input.value = query;
    void this.run(query);
    this.input.focus({ preventScroll: true });
  }

  private async run(raw: string): Promise<void> {
    const request = ++this.request;
    const query = raw.trim();
    if (!query) {
      this.results.replaceChildren(h('p', { class: 'muted' }, 'Almanca ya da Türkçe yaz.'));
      return;
    }
    const [grammar, street, redemittel] = await Promise.all([loadGrammar(), loadStreet(), loadRedemittel()]);
    // A newer keystroke started another search while this one was loading.
    if (request !== this.request) return;

    const words = filterRows(buildRows([...this.app.notes.values()], this.app.allStates), {
      query: query.toLocaleLowerCase('de'),
      type: 'all',
      status: 'all',
    });
    const topics = filterTopics(grammar, { level: 'all', query });
    const phrases = searchPhrases(street, { register: 'all', query });
    const patterns = searchRedemittel(redemittel, query);

    const section = (title: string, count: number, items: HTMLElement[], more?: string) =>
      count === 0
        ? null
        : h(
            'section',
            { class: 'search-section' },
            h('h3', { class: 'phrase-heading' }, `${title} · ${count}`),
            h('ul', { class: 'search-list' }, ...items),
            more && count > LIMIT ? h('a', { class: 'search-more', href: more }, `Tümünü gör (${count}) →`) : null,
          );

    const sections = [
      section(
        'Kelimeler',
        words.length,
        words.slice(0, LIMIT).map(({ note }) =>
          h(
            'li',
            {},
            h(
              'a',
              { class: 'search-item', href: href({ name: 'words', id: note.id }), 'data-testid': 'search-word' },
              h('span', { class: 'search-item-title' }, headwordToString(buildHeadword(note))),
              h('span', { class: 'search-item-sub' }, `${typeLabelTr(note.type)} · ${note.meaningTr}`),
            ),
          ),
        ),
      ),
      section(
        'Gramer',
        topics.length,
        topics.slice(0, LIMIT).map((topic) =>
          h(
            'li',
            {},
            h(
              'a',
              { class: 'search-item', href: href({ name: 'grammar', id: topic.id }), 'data-testid': 'search-grammar' },
              h('span', { class: 'search-item-title' }, `${topic.level} · ${topic.titleDe}`),
              h('span', { class: 'search-item-sub' }, topic.titleTr),
            ),
          ),
        ),
      ),
      section(
        'Kalıplar',
        patterns.length,
        patterns.slice(0, LIMIT).map(({ group, item }) =>
          h(
            'li',
            {},
            h(
              'a',
              { class: 'search-item', href: href({ name: 'phrases', id: group.id }), 'data-testid': 'search-phrase' },
              h('span', { class: 'search-item-title' }, item.de),
              h('span', { class: 'search-item-sub' }, `${item.tr} · ${group.icon} ${group.titleTr}`),
            ),
          ),
        ),
      ),
      section(
        'Sokak dili',
        phrases.length,
        phrases.slice(0, LIMIT).map(({ topic, phrase }) =>
          h(
            'li',
            {},
            h(
              'a',
              { class: 'search-item', href: href({ name: 'street', id: topic.id }), 'data-testid': 'search-street' },
              h('span', { class: 'search-item-title' }, phrase.de.replaceAll('**', '')),
              h('span', { class: 'search-item-sub' }, `${phrase.tr} · ${topic.icon} ${topic.titleTr}`),
            ),
          ),
        ),
      ),
    ].filter((node): node is HTMLElement => node !== null);

    this.results.replaceChildren(...(sections.length ? sections : [h('p', { class: 'empty muted' }, 'Sonuç yok.')]));
  }
}
