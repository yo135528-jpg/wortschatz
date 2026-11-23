import { buildHeadword, headwordToString } from '../domain/format';
import type { Note } from '../domain/schema';
import { glossaryEntry, plainSentence, segments, storyLemmas, type Story } from '../domain/stories';
import { h } from './dom';
import { icon } from './icons';
import { href, navigate } from './router';
import { speakButton, speakGerman } from './tts';

export interface StoryCardActions {
  /** The learner's notes, to tell known words from new ones. */
  notes(): Iterable<Note>;
  has(story: Story, lemma: string): boolean;
  add(story: Story, lemma: string): Promise<void>;
}

const KNOWN_KEY = 'wortschatz.story-known';
const PROGRESS_KEY = 'wortschatz.story-progress';
const TR_KEY = 'wortschatz.story-tr';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked: the choice only lasts for this visit.
  }
}

type WordState = 'card' | 'new' | 'known';

/** "Okuma": graded stories; tapping a word shows its card or adds a new one. */
export class StoriesView {
  private openId: string | null = null;
  private part = 0;
  private showTr = readJson<boolean>(TR_KEY, false);
  private known = new Set(readJson<string[]>(KNOWN_KEY, []));
  private sheet: HTMLElement | null = null;
  private selected: HTMLElement | null = null;

  constructor(
    private readonly stories: Story[],
    private readonly root: HTMLElement,
    private readonly cards: StoryCardActions,
  ) {}

  show(id: string | null): void {
    const story = id ? this.stories.find((s) => s.id === id) : undefined;
    if (story && story.id !== this.openId) this.part = Math.min(this.progress()[story.id] ?? 0, story.parts.length - 1);
    this.openId = story?.id ?? null;
    this.render();
  }

  private progress(): Record<string, number> {
    return readJson<Record<string, number>>(PROGRESS_KEY, {});
  }

  private render(): void {
    this.closeSheet();
    const story = this.stories.find((s) => s.id === this.openId);
    this.root.replaceChildren(...(story ? this.renderReader(story) : this.renderList()));
  }

  // ---------- List ----------

  private renderList(): HTMLElement[] {
    const progress = this.progress();
    const byLemma = this.noteIndex();
    return [
      h('h2', { class: 'section-title' }, 'Okuma'),
      h('p', { class: 'muted small' }, 'Seviyene göre kısa hikâyeler. Altı çizili kelimeye dokun: kartlarında varsa hatırla, yoksa tek dokunuşla ekle.'),
      h(
        'div',
        { class: 'story-list' },
        ...this.stories.map((story) => {
          const lemmas = storyLemmas(story);
          const fresh = lemmas.filter((lemma) => !byLemma.has(lemma.toLowerCase())).length;
          const read = progress[story.id];
          return h(
            'a',
            { class: 'story-card', href: href({ name: 'stories', id: story.id }), 'data-testid': 'story-card' },
            h('span', { class: 'story-card-top' }, h('span', { class: `level level-${story.level}` }, story.level), story.chapter && h('span', { class: 'muted small' }, story.chapter)),
            h('strong', { class: 'story-card-title' }, story.title),
            h('span', { class: 'muted' }, story.titleTr),
            h('span', { class: 'small story-card-summary' }, story.summaryTr),
            h(
              'span',
              { class: 'story-card-meta small' },
              `${story.parts.length} bölüm · ${lemmas.length} kelime`,
              fresh ? h('span', { class: 'story-new-count' }, `${fresh} yeni`) : null,
              read !== undefined ? h('span', { class: 'muted' }, `Bölüm ${Math.min(read + 1, story.parts.length)}/${story.parts.length}`) : null,
            ),
          );
        }),
      ),
    ];
  }

  // ---------- Reader ----------

  private noteIndex(): Map<string, Note> {
    const map = new Map<string, Note>();
    for (const note of this.cards.notes()) {
      const key = note.lemma.toLowerCase();
      if (!map.has(key)) map.set(key, note);
    }
    return map;
  }

  private wordState(story: Story, lemma: string, byLemma: Map<string, Note>): WordState {
    if (byLemma.has(lemma.toLowerCase()) || this.cards.has(story, lemma)) return 'card';
    return this.known.has(lemma.toLowerCase()) ? 'known' : 'new';
  }

  private renderReader(story: Story): HTMLElement[] {
    const index = this.stories.indexOf(story);
    const part = story.parts[this.part]!;
    const byLemma = this.noteIndex();
    const percent = Math.round(((this.part + 1) / story.parts.length) * 100);
    const partText = part.paragraphs.flat().map((s) => plainSentence(s.de)).join(' ');

    const head = h(
      'div',
      { class: 'reader-head' },
      h(
        'div',
        { class: 'reader-title' },
        h('span', { class: 'reader-kicker' }, `${story.level} · HİKÂYE ${index + 1} · BÖLÜM ${this.part + 1}`),
        h('strong', {}, story.title),
      ),
      h(
        'button',
        { type: 'button', class: 'reader-speak', 'aria-label': 'Bölümü sesli dinle', onclick: () => void speakGerman(partText) },
        icon('speaker'),
      ),
    );
    const progress = h('div', { class: 'reader-progress', 'aria-hidden': 'true' }, h('span', { style: `width:${percent}%` }));

    const trToggle = h(
      'button',
      {
        type: 'button',
        class: 'chip reader-tr',
        'aria-pressed': String(this.showTr),
        'data-testid': 'story-tr',
        onclick: () => {
          this.showTr = !this.showTr;
          writeJson(TR_KEY, this.showTr);
          this.render();
        },
      },
      'Türkçesi',
    );

    const body = h(
      'div',
      { class: `reader-text ${this.showTr ? 'with-tr' : ''}`, 'data-testid': 'story-text' },
      h('h3', { class: 'reader-part-title' }, part.title),
      ...part.paragraphs.map((paragraph) =>
        h(
          'p',
          { class: 'reader-paragraph' },
          ...paragraph.map((sentence) =>
            h(
              'span',
              { class: 'reader-sentence' },
              h(
                'span',
                { class: 'reader-de' },
                ...segments(sentence.de).map((segment) => {
                  if (segment.kind === 'text') return segment.value;
                  const state = this.wordState(story, segment.lemma, byLemma);
                  return h(
                    'button',
                    {
                      type: 'button',
                      class: `reader-word is-${state}`,
                      'data-testid': 'story-word',
                      'data-lemma': segment.lemma,
                      onclick: (event: Event) => this.openWord(story, segment.lemma, event.currentTarget as HTMLElement),
                    },
                    segment.surface,
                  );
                }),
                ' ',
              ),
              this.showTr ? h('span', { class: 'reader-tr-line' }, sentence.tr) : null,
            ),
          ),
        ),
      ),
    );

    const last = this.part === story.parts.length - 1;
    const nav = h(
      'div',
      { class: 'reader-nav' },
      this.part > 0
        ? h('button', { type: 'button', class: 'button', onclick: () => this.goPart(story, this.part - 1) }, 'Önceki bölüm')
        : h('a', { class: 'button', href: href({ name: 'stories', id: null }) }, 'Tüm hikâyeler'),
      last
        ? h('button', { type: 'button', class: 'primary', 'data-testid': 'story-finish', onclick: () => this.finish(story) }, 'Hikâyeyi bitir')
        : h('button', { type: 'button', class: 'primary', 'data-testid': 'story-next', onclick: () => this.goPart(story, this.part + 1) }, 'Sonraki bölüm'),
    );

    return [
      head,
      progress,
      h('div', { class: 'reader-tools' }, trToggle),
      body,
      h('p', { class: 'reader-legend small' }, h('span', { class: 'reader-word is-card' }, 'Sarı'), ': kartlarında var · ', h('span', { class: 'reader-word is-new' }, 'Mavi'), ': yeni kelime. Dokun, anlamını gör.'),
      nav,
    ];
  }

  private goPart(story: Story, part: number): void {
    this.part = part;
    writeJson(PROGRESS_KEY, { ...this.progress(), [story.id]: part });
    this.render();
    window.scrollTo({ top: 0 });
  }

  private finish(story: Story): void {
    writeJson(PROGRESS_KEY, { ...this.progress(), [story.id]: story.parts.length });
    navigate({ name: 'stories', id: null });
  }

  // ---------- Word sheet ----------

  private closeSheet(): void {
    this.sheet?.remove();
    this.sheet = null;
    this.selected?.classList.remove('is-selected');
    this.selected = null;
  }

  private openWord(story: Story, lemma: string, button: HTMLElement): void {
    this.closeSheet();
    this.selected = button;
    button.classList.add('is-selected');
    const byLemma = this.noteIndex();
    const note = byLemma.get(lemma.toLowerCase());
    const entry = glossaryEntry(story, lemma);
    const close = h('button', { type: 'button', class: 'sheet-close', 'aria-label': 'Kapat', onclick: () => this.closeSheet() }, '✕');

    let content: (HTMLElement | null)[];
    if (note) {
      const headword = buildHeadword(note);
      content = [
        h('div', { class: 'sheet-head' }, h('span', { class: 'sheet-word' }, headwordToString(headword)), speakButton(headword.speech), h('span', { class: 'sheet-badge is-card' }, 'kartlarında var')),
        h('p', { class: 'sheet-meaning' }, note.meaningTr),
        note.examples[0] ? h('p', { class: 'sheet-example' }, note.examples[0].de) : null,
        h(
          'div',
          { class: 'sheet-actions' },
          h('button', { type: 'button', class: 'button', onclick: () => this.closeSheet() }, 'Tamam'),
          h('a', { class: 'button primary', href: href({ name: 'words', id: note.id }) }, 'Kartı aç'),
        ),
      ];
    } else if (entry) {
      const added = this.cards.has(story, lemma);
      const title = entry.type === 'noun' ? `${(entry.noun as { gender: string }).gender} ${lemma}` : lemma;
      const addButton = h(
        'button',
        {
          type: 'button',
          class: 'button primary',
          'data-testid': 'story-add',
          disabled: added,
          onclick: async () => {
            await this.cards.add(story, lemma);
            addButton.textContent = 'Kartlarına eklendi';
            addButton.setAttribute('disabled', '');
            button.className = 'reader-word is-card is-selected';
          },
        },
        added ? 'Kartlarına eklendi' : 'Kartlarıma ekle',
      );
      content = [
        h('div', { class: 'sheet-head' }, h('span', { class: 'sheet-word' }, title), speakButton(lemma), h('span', { class: 'sheet-badge' }, 'yeni kelime')),
        h('p', { class: 'sheet-meaning' }, String(entry.meaningTr)),
        entry.note ? h('p', { class: 'sheet-example' }, String(entry.note)) : null,
        h(
          'div',
          { class: 'sheet-actions' },
          h(
            'button',
            {
              type: 'button',
              class: 'button',
              onclick: () => {
                this.known.add(lemma.toLowerCase());
                writeJson(KNOWN_KEY, [...this.known]);
                button.className = 'reader-word is-known';
                this.closeSheet();
              },
            },
            'Biliyorum',
          ),
          addButton,
        ),
      ];
    } else {
      content = [h('p', {}, lemma)];
    }
    this.sheet = h('div', { class: 'word-sheet', role: 'dialog', 'aria-label': lemma, 'data-testid': 'word-sheet' }, close, ...content);
    this.root.append(this.sheet);
  }
}
