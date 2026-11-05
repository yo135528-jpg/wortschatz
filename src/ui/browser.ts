import type { App } from '../app';
import { buildHeadword, headwordToString, typeLabelTr } from '../domain/format';
import type { Note } from '../domain/schema';
import { cardKey } from '../domain/cards';
import { State } from '../scheduling/fsrs';
import { renderBack } from './cardFaces';
import { h } from './dom';

const STATE_LABELS: Record<number, string> = {
  [State.New]: 'yeni',
  [State.Learning]: 'öğreniliyor',
  [State.Review]: 'tekrar',
  [State.Relearning]: 'yeniden',
};

function matches(note: Note, query: string): boolean {
  if (!query) return true;
  const haystack = [note.lemma, note.meaningTr, note.source, ...note.tags, ...note.examples.map((e) => e.de)]
    .join(' ')
    .toLocaleLowerCase('de');
  return haystack.includes(query);
}

/** Card browser: search, inspect and suspend cards. */
export class BrowserView {
  private query = '';
  private openNoteId: string | null = null;
  private list: HTMLElement;

  constructor(
    private readonly app: App,
    root: HTMLElement,
  ) {
    const search = h('input', {
      type: 'search',
      class: 'search',
      placeholder: 'Ara: kelime, anlam, etiket…',
      'aria-label': 'Ara',
      'data-testid': 'search',
      oninput: (event: Event) => {
        this.query = (event.target as HTMLInputElement).value.trim().toLocaleLowerCase('de');
        this.refresh();
      },
    });
    this.list = h('ul', { class: 'note-list', 'data-testid': 'note-list' });
    root.append(search, this.list);
  }

  refresh(): void {
    const notes = [...this.app.notes.values()].filter((note) => matches(note, this.query));
    this.list.replaceChildren(
      ...notes.map((note) => this.renderNote(note)),
      ...(notes.length ? [] : [h('li', { class: 'muted' }, 'Sonuç yok.')]),
    );
  }

  private renderNote(note: Note): HTMLElement {
    const isOpen = this.openNoteId === note.id;
    const headword = buildHeadword(note);
    return h(
      'li',
      { class: `note-item ${isOpen ? 'open' : ''}`, 'data-testid': 'note-item' },
      h(
        'button',
        {
          class: 'note-summary',
          type: 'button',
          'aria-expanded': String(isOpen),
          onclick: () => {
            this.openNoteId = isOpen ? null : note.id;
            this.refresh();
          },
        },
        h('span', { class: `note-title ${headword.article ? `g-${headword.article}` : ''}` }, headwordToString(headword)),
        h('span', { class: 'note-meta' }, `${typeLabelTr(note.type)} · ${note.meaningTr}`),
      ),
      isOpen && this.renderDetails(note),
    );
  }

  private renderDetails(note: Note): HTMLElement {
    const rows = note.directions.map((direction) => {
      const state = this.app.allStates.find((s) => s.key === cardKey(note.id, direction));
      if (!state) return null;
      const due = state.fsrs.state === State.New ? '—' : state.fsrs.dueAt.toLocaleDateString('tr-TR');
      return h(
        'div',
        { class: 'card-row' },
        h('span', { class: 'direction' }, direction === 'de2tr' ? 'DE → TR' : 'TR → DE'),
        h('span', { class: 'muted' }, `${STATE_LABELS[state.fsrs.state] ?? ''} · vade ${due}`),
        h(
          'button',
          {
            type: 'button',
            class: `suspend ${state.suspended ? 'is-suspended' : ''}`,
            'data-testid': `suspend-${direction}`,
            onclick: () => void this.app.setSuspended(state.key, !state.suspended),
          },
          state.suspended ? 'Askıdan al' : 'Askıya al',
        ),
      );
    });
    return h(
      'div',
      { class: 'note-details' },
      renderBack(note, 'tr2de'),
      h('p', { class: 'muted small' }, `${note.source} · ${note.tags.join(', ')} · ${note.id}`),
      ...rows,
    );
  }
}
