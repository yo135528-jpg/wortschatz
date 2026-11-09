import type { App } from '../app';
import { buildHeadword, headwordToString, typeLabelTr } from '../domain/format';
import type { Note, NoteType } from '../domain/schema';
import { cardKey } from '../domain/cards';
import { State } from '../scheduling/fsrs';
import {
  buildRows,
  filterRows,
  groupBySource,
  sortRows,
  summarize,
  type NoteRow,
  type NoteStatus,
  type SortOrder,
  type StatusFilter,
  type TypeFilter,
} from './browseModel';
import { renderBack } from './cardFaces';
import { h } from './dom';

const STATE_LABELS: Record<number, string> = {
  [State.New]: 'yeni',
  [State.Learning]: 'öğreniliyor',
  [State.Review]: 'tekrar',
  [State.Relearning]: 'yeniden',
};

const STATUS_LABELS: Record<NoteStatus, string> = {
  new: 'Yeni',
  learning: 'Öğreniliyor',
  mature: 'Oturmuş',
  suspended: 'Askıda',
};

const TYPES: NoteType[] = ['noun', 'verb', 'adjective', 'expression', 'other'];

const SORT_LABELS: Record<SortOrder, string> = {
  book: 'Kitap sırası',
  alpha: 'Alfabetik',
  newest: 'En yeni',
  hardest: 'En zor',
};

/** Card browser: overview, search, filter and inspect/suspend cards. */
export class BrowserView {
  private query = '';
  private type: TypeFilter = 'all';
  private status: StatusFilter = 'all';
  private sort: SortOrder = 'book';
  private openNoteId: string | null = null;
  private readonly closedGroups = new Set<string>();
  private readonly controls: HTMLElement;
  private readonly list: HTMLElement;

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
    this.controls = h('div', { class: 'browse-controls' });
    this.list = h('div', { class: 'browse-list', 'data-testid': 'note-list' });
    root.append(search, this.controls, this.list);
  }

  refresh(): void {
    const allRows = buildRows([...this.app.notes.values()], this.app.allStates);
    const rows = sortRows(filterRows(allRows, { query: this.query, type: this.type, status: this.status }), this.sort);
    this.controls.replaceChildren(...this.renderControls(allRows, rows.length));
    this.list.replaceChildren(...this.renderList(rows));
  }

  private renderControls(allRows: NoteRow[], shown: number): HTMLElement[] {
    const summary = summarize(allRows);
    const filtered = shown !== allRows.length;
    const statusChips: [StatusFilter, string, number][] = [
      ['all', 'Tümü', summary.notes],
      ['new', STATUS_LABELS.new, summary.byStatus.new],
      ['learning', STATUS_LABELS.learning, summary.byStatus.learning],
      ['mature', STATUS_LABELS.mature, summary.byStatus.mature],
      ['hard', 'Zor', summary.hard],
      ['suspended', STATUS_LABELS.suspended, summary.byStatus.suspended],
    ];
    return [
      h(
        'div',
        { class: 'browse-summary' },
        h(
          'span',
          { 'data-testid': 'browse-count' },
          filtered ? `${shown} / ${summary.notes} kelime` : `${summary.notes} kelime · ${summary.cards} kart`,
        ),
        h(
          'span',
          { class: 'legend', 'aria-hidden': 'true' },
          h('span', { class: 'g-der' }, 'der'),
          h('span', { class: 'g-die' }, 'die'),
          h('span', { class: 'g-das' }, 'das'),
        ),
      ),
      h(
        'div',
        { class: 'chips', role: 'group', 'aria-label': 'Durum' },
        ...statusChips
          // Hide empty status chips (except "all") to keep the row short.
          .filter(([value, , count]) => value === 'all' || count > 0 || this.status === value)
          .map(([value, label, count]) =>
            this.chip(label, count, this.status === value, () => (this.status = value), value === 'all' ? '' : `dot-${value}`),
          ),
      ),
      h(
        'div',
        { class: 'chips' },
        ...(['all', ...TYPES] as TypeFilter[]).map((value) =>
          this.chip(value === 'all' ? 'Tüm türler' : typeLabelTr(value), null, this.type === value, () => (this.type = value)),
        ),
        h(
          'select',
          {
            class: 'sort',
            'aria-label': 'Sıralama',
            onchange: (event: Event) => {
              this.sort = (event.target as HTMLSelectElement).value as SortOrder;
              this.refresh();
            },
          },
          ...(Object.keys(SORT_LABELS) as SortOrder[]).map((value) =>
            h('option', { value, selected: this.sort === value }, SORT_LABELS[value]),
          ),
        ),
      ),
    ];
  }

  private chip(label: string, count: number | null, active: boolean, select: () => void, dotClass = ''): HTMLElement {
    return h(
      'button',
      {
        type: 'button',
        class: 'chip',
        'aria-pressed': String(active),
        onclick: () => {
          select();
          this.refresh();
        },
      },
      dotClass && h('span', { class: `dot ${dotClass}` }),
      label,
      count !== null && h('span', { class: 'chip-count' }, String(count)),
    );
  }

  private renderList(rows: NoteRow[]): HTMLElement[] {
    if (!rows.length) return [h('p', { class: 'muted' }, 'Sonuç yok.')];
    // Book order reads best by page; other orders are a flat ranking.
    if (this.sort !== 'book') return [this.renderRows(rows)];
    const searching = this.query !== '' || this.type !== 'all' || this.status !== 'all';
    return groupBySource(rows).map((group) => {
      const open = searching || !this.closedGroups.has(group.label);
      return h(
        'section',
        { class: 'group' },
        h(
          'button',
          {
            type: 'button',
            class: 'group-header',
            'aria-expanded': String(open),
            onclick: () => {
              if (open) this.closedGroups.add(group.label);
              else this.closedGroups.delete(group.label);
              this.refresh();
            },
          },
          h('span', { class: 'chevron', 'aria-hidden': 'true' }, open ? '▾' : '▸'),
          group.label,
          h('span', { class: 'chip-count' }, String(group.rows.length)),
        ),
        open && this.renderRows(group.rows),
      );
    });
  }

  private renderRows(rows: NoteRow[]): HTMLElement {
    return h('ul', { class: 'note-list' }, ...rows.map((row) => this.renderNote(row)));
  }

  private renderNote({ note, status }: NoteRow): HTMLElement {
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
        h(
          'span',
          { class: 'note-title' },
          h('span', { class: `dot dot-${status}`, title: STATUS_LABELS[status] }),
          h('span', { class: headword.article ? `g-${headword.article}` : '' }, headwordToString(headword)),
        ),
        h(
          'span',
          { class: 'note-meta' },
          h('span', { class: 'type-tag' }, typeLabelTr(note.type)),
          h('span', { class: 'note-meaning' }, note.meaningTr),
        ),
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
    return h('div', { class: 'note-details' }, renderBack(note, 'tr2de'), ...rows);
  }
}
