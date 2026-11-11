import type { App } from '../app';
import { loadGrammar, loadStreet } from '../content';
import { checkAnswer, diffWords, type Verdict } from '../domain/answer';
import {
  artikelQuestions,
  dictationQuestions,
  grammarQuestions,
  pickRound,
  rektionQuestions,
  streetQuestions,
  verbQuestions,
  writingQuestions,
  type DrillKind,
  type Field,
  type Question,
} from '../domain/drills';
import { articleQuestions, noArticleQuestions } from '../domain/adjectives';
import { shuffle } from '../domain/drills';
import type { Note } from '../domain/schema';
import { saveSkillAnswer } from './skillStore';
import { buildRows } from './browseModel';
import { ALL_SCOPE, inScope } from '../domain/scope';
import { scopeSelect } from './scopeSelect';
import { h } from './dom';
import { href } from './router';
import { isSpeechSupported, geminiKey, speakButton, speakGerman } from './tts';

interface DrillInfo {
  icon: string;
  title: string;
  description: string;
  /** Uses the learner's cards (chapter filter applies). */
  fromNotes: boolean;
  build: (ctx: { app: App; notes: Note[] }) => Promise<Question[]> | Question[];
  /** Shown when there are no questions. */
  emptyText?: string;
}

/** Notes that were forgotten at least once, hardest first. */
function hardNotes(app: App, notes: Note[]): Note[] {
  return buildRows(notes, app.allStates)
    .filter((row) => row.lapses > 0)
    .sort((a, b) => b.lapses - a.lapses)
    .map((row) => row.note);
}

export const DRILLS: Record<DrillKind, DrillInfo> = {
  schreiben: {
    icon: '⌨️',
    title: 'Yazarak hatırla',
    description: 'Türkçesini gör, Almancasını yaz (isimler artikeliyle).',
    fromNotes: true,
    build: ({ notes }) => writingQuestions(notes),
  },
  artikel: {
    icon: '🎨',
    title: 'der · die · das',
    description: 'İsimlerin artikelini hızlıca seç.',
    fromNotes: true,
    build: ({ notes }) => artikelQuestions(notes),
  },
  verben: {
    icon: '🔁',
    title: 'Fiil çekimleri',
    description: 'Präteritum, Partizip II ve haben/sein.',
    fromNotes: true,
    build: ({ notes }) => verbQuestions(notes),
  },
  rektion: {
    icon: '🔗',
    title: 'Fiil + edat',
    description: 'warten ___ + ? → auf + Akk',
    fromNotes: true,
    build: ({ notes }) => rektionQuestions(notes),
  },
  adjektiv: {
    icon: '🎯',
    title: 'Sıfat çekimi',
    description: 'mit groß___ Interesse → -em. Artikelli ve artikelsiz.',
    fromNotes: true,
    // Half curated no-article phrases (the tricky ones), half built from the learner's nouns.
    build: ({ notes }) => {
      const fixed = noArticleQuestions();
      return [...fixed, ...shuffle(articleQuestions(notes)).slice(0, fixed.length)];
    },
  },
  zor: {
    icon: '🧗',
    title: 'Zor kelimeler',
    description: 'Daha önce unuttuğun kelimeleri yazarak çalış.',
    fromNotes: true,
    build: ({ app, notes }) => writingQuestions(hardNotes(app, notes)),
    emptyText: 'Henüz unuttuğun bir kelime yok. Kart tekrarında „Tekrar“ dediğin kelimeler burada toplanır.',
  },
  dikte: {
    icon: '🎧',
    title: 'Dikte',
    description: 'Cümleyi dinle, duyduğunu yaz.',
    fromNotes: true,
    build: ({ notes }) => dictationQuestions(notes),
  },
  gramer: {
    icon: '🧩',
    title: 'Gramer boşlukları',
    description: 'Gramer konularındaki örneklerde boşluğu doldur.',
    fromNotes: false,
    build: async () => grammarQuestions(await loadGrammar()),
  },
  sokak: {
    icon: '💬',
    title: 'Sokak dili quiz',
    description: 'Bu ifade ne demek? 4 seçenekten bul.',
    fromNotes: false,
    build: async () => streetQuestions(await loadStreet()),
  },
};

/** Drills whose results count as one skill when a question has no own skill. */
const TRACKED = new Set<DrillKind>(['artikel', 'verben', 'rektion']);

const CHAPTER_KEY = 'wortschatz.drill-scope';
const ALL = ALL_SCOPE;

function readChapter(): string {
  try {
    return localStorage.getItem(CHAPTER_KEY) ?? ALL;
  } catch {
    return ALL;
  }
}

function writeChapter(value: string): void {
  try {
    localStorage.setItem(CHAPTER_KEY, value);
  } catch {
    // Private mode: the filter just is not remembered.
  }
}

const VERDICT_TEXT: Record<Verdict, string> = { correct: '✓ Doğru', almost: '≈ Neredeyse', wrong: '✗ Yanlış' };

interface Result {
  question: Question;
  verdict: Verdict;
}

/** Practice drill screen: start → questions → summary. */
export class DrillView {
  private kind: DrillKind | null = null;
  private chapter = readChapter();
  private queue: Question[] = [];
  private index = 0;
  private results: Result[] = [];
  private retried = new Set<string>();
  private answered = false;
  private picks: (string | null)[] = [];
  private inputs: HTMLInputElement[] = [];
  private lastInput: HTMLInputElement | null = null;

  constructor(
    private readonly app: App,
    private readonly root: HTMLElement,
  ) {
    document.addEventListener('keydown', (event) => {
      if (this.root.hidden || event.key !== 'Enter' || this.queue.length === 0) return;
      const target = event.target as HTMLElement;
      if (target.closest('select, button')) return;
      event.preventDefault();
      if (this.answered) this.next();
      else this.check();
    });
  }

  show(kind: string): void {
    this.kind = kind in DRILLS ? (kind as DrillKind) : null;
    this.queue = [];
    this.renderStart();
  }

  private notes(): Note[] {
    const notes = [...this.app.notes.values()];
    return notes.filter((note) => inScope(note, this.chapter));
  }

  private header(): HTMLElement {
    return h('a', { class: 'grammar-back button', href: href({ name: 'study' }), 'data-testid': 'drill-back' }, '← Çalış');
  }

  // ---------- Start ----------

  private renderStart(): void {
    if (!this.kind) {
      this.root.replaceChildren(this.header(), h('p', { class: 'empty muted' }, 'Böyle bir antrenman yok.'));
      return;
    }
    const info = DRILLS[this.kind];
    const needsSpeech = this.kind === 'dikte' && !isSpeechSupported() && !geminiKey();
    const chapterSelect = info.fromNotes
      ? h(
          'label',
          { class: 'field' },
          h('span', {}, 'Kelimeler'),
          scopeSelect(
            this.app.notes.values(),
            this.chapter,
            (scope) => {
              this.chapter = scope;
              writeChapter(scope);
            },
            'drill-chapter',
          ),
        )
      : null;
    this.root.replaceChildren(
      this.header(),
      h(
        'section',
        { class: 'drill-start', 'data-testid': 'drill-start', 'data-kind': this.kind },
        h('div', { class: 'drill-start-icon', 'aria-hidden': 'true' }, info.icon),
        h('h2', {}, info.title),
        h('p', { class: 'muted' }, info.description),
        chapterSelect,
        needsSpeech ? h('p', { class: 'grammar-callout grammar-warning' }, 'Bu tarayıcıda sesli okuma yok. Ayarlar\'dan Gemini anahtarı ekleyebilirsin.') : null,
        h(
          'button',
          { type: 'button', class: 'primary big', 'data-testid': 'drill-go', disabled: needsSpeech, onclick: () => void this.begin() },
          'Başla',
        ),
      ),
    );
  }

  private async begin(): Promise<void> {
    if (!this.kind) return;
    const info = DRILLS[this.kind];
    const all = await info.build({ app: this.app, notes: this.notes() });
    if (all.length === 0) {
      this.root.replaceChildren(
        this.header(),
        h('p', { class: 'empty muted', 'data-testid': 'drill-empty' }, info.emptyText ?? 'Bu bölümde bu antrenman için soru yok. Başka bir bölüm seç.'),
      );
      return;
    }
    this.queue = pickRound(all);
    this.index = 0;
    this.results = [];
    this.retried = new Set();
    this.renderQuestion();
  }

  // ---------- Question ----------

  private get question(): Question {
    return this.queue[this.index]!;
  }

  private renderQuestion(): void {
    const question = this.question;
    this.answered = false;
    this.picks = question.fields.map(() => null);
    this.inputs = [];
    this.lastInput = null;
    const position = Math.min(this.index + 1, this.queue.length);

    const onlyChoice = question.fields.length === 1 && question.fields[0]!.kind === 'choice';
    const fields = question.fields.map((field, i) => this.renderField(field, i, onlyChoice));
    const hasText = question.fields.some((field) => field.kind === 'text');

    this.root.replaceChildren(
      h(
        'div',
        { class: 'drill-top' },
        this.header(),
        h('span', { class: 'muted small', 'data-testid': 'drill-progress' }, `${position} / ${this.queue.length}`),
      ),
      h(
        'div',
        { class: 'progress thin' },
        h('div', { class: 'progress-fill', style: `width:${Math.round((this.index / this.queue.length) * 100)}%` }),
      ),
      h(
        'section',
        { class: 'drill-card', 'data-testid': 'drill-question', 'data-id': question.id },
        question.audioOnly
          ? h(
              'div',
              { class: 'drill-audio' },
              h('button', { type: 'button', class: 'primary', 'data-testid': 'drill-listen', onclick: () => void speakGerman(question.audio!) }, '🔊 Dinle'),
            )
          : h('h2', { class: 'drill-title' }, question.title, question.audioInPrompt && question.audio ? speakButton(question.audio) : null),
        question.subtitle ? h('p', { class: 'drill-subtitle' }, question.subtitle) : null,
        question.sentence ? h('p', { class: 'drill-sentence' }, question.sentence) : null,
        h('div', { class: 'drill-fields' }, ...fields),
        hasText ? this.umlautRow() : null,
        h('div', { class: 'drill-feedback', 'data-testid': 'drill-feedback', hidden: true }),
        h(
          'div',
          { class: 'drill-actions' },
          onlyChoice ? null : h('button', { type: 'button', class: 'primary', 'data-testid': 'drill-check', onclick: () => this.check() }, 'Kontrol et ', h('kbd', {}, 'Enter')),
          h('button', { type: 'button', class: 'primary', 'data-testid': 'drill-next', hidden: true, onclick: () => this.next() }, 'Devam ', h('kbd', {}, 'Enter')),
        ),
      ),
    );
    if (question.audioOnly && question.audio) void speakGerman(question.audio);
    this.inputs[0]?.focus({ preventScroll: true });
  }

  private renderField(field: Field, index: number, autoCheck: boolean): HTMLElement {
    if (field.kind === 'text') {
      const input = h('input', {
        type: 'text',
        class: 'drill-input',
        autocomplete: 'off',
        autocapitalize: 'off',
        spellcheck: 'false',
        lang: 'de',
        'aria-label': field.label,
        'data-testid': `drill-input-${index}`,
        onfocus: () => (this.lastInput = input),
      });
      this.inputs.push(input);
      return h('label', { class: 'drill-field', 'data-field': index }, h('span', { class: 'drill-label' }, field.label), input);
    }
    const buttons = field.options.map((option) =>
      h(
        'button',
        {
          type: 'button',
          class: `choice choice-${option.replace(/[^a-z]/gi, '').toLowerCase()}`,
          'data-testid': 'drill-choice',
          'data-value': option,
          onclick: () => {
            if (this.answered) return;
            this.picks[index] = option;
            buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.value === option)));
            if (autoCheck) this.check();
          },
        },
        option,
      ),
    );
    return h(
      'div',
      { class: 'drill-field', 'data-field': index },
      h('span', { class: 'drill-label' }, field.label),
      // Long options (translations) are stacked; short ones (der/die/das, -em) sit in one row.
      h('div', { class: `choices ${field.options.some((option) => option.length > 6) ? 'choices-list' : ''}` }, ...buttons),
    );
  }

  private umlautRow(): HTMLElement {
    return h(
      'div',
      { class: 'umlauts', 'aria-label': 'Özel harfler' },
      ...['ä', 'ö', 'ü', 'ß'].map((letter) =>
        h(
          'button',
          {
            type: 'button',
            tabindex: -1,
            onmousedown: (event: Event) => event.preventDefault(),
            onclick: () => {
              const input = this.lastInput ?? this.inputs[0];
              if (!input || this.answered) return;
              const start = input.selectionStart ?? input.value.length;
              const end = input.selectionEnd ?? start;
              input.setRangeText(letter, start, end, 'end');
              input.focus();
            },
          },
          letter,
        ),
      ),
    );
  }

  private check(): void {
    if (this.answered || this.queue.length === 0) return;
    const question = this.question;
    // Nothing chosen in a choice-only question yet: wait.
    if (question.fields.every((field, i) => field.kind === 'choice' && this.picks[i] === null)) return;
    let textIndex = 0;
    const verdicts: Verdict[] = question.fields.map((field, i) => {
      if (field.kind === 'text') {
        const input = this.inputs[textIndex++]!;
        input.readOnly = true;
        return checkAnswer(input.value, field.answers);
      }
      const pick = this.picks[i] ?? null;
      return pick !== null && (pick === field.answer || field.answer.split('/').includes(pick)) ? 'correct' : 'wrong';
    });

    this.answered = true;
    const verdict: Verdict = verdicts.includes('wrong') ? 'wrong' : verdicts.includes('almost') ? 'almost' : 'correct';
    // Only the first attempt counts for the score.
    if (!this.results.some((r) => r.question.id === question.id)) {
      this.results.push({ question, verdict });
      // Typing and listening drills train single words, not a skill worth tracking.
      const skill = question.skill ?? (this.kind && TRACKED.has(this.kind) ? this.kind : null);
      if (skill) saveSkillAnswer(skill, verdict !== 'wrong');
    }
    // A mistake comes back once at the end of the round.
    if (verdict === 'wrong' && !this.retried.has(question.id)) {
      this.retried.add(question.id);
      this.queue.push(question);
    }
    this.showFeedback(verdicts, verdict);
  }

  private showFeedback(verdicts: Verdict[], verdict: Verdict): void {
    const question = this.question;
    question.fields.forEach((field, i) => {
      const element = this.root.querySelector<HTMLElement>(`[data-field="${i}"]`);
      element?.classList.add(`is-${verdicts[i]}`);
      if (field.kind === 'choice') {
        element?.querySelectorAll<HTMLButtonElement>('.choice').forEach((button) => {
          const value = button.dataset.value!;
          const right = value === field.answer || field.answer.split('/').includes(value);
          if (right) button.classList.add('is-answer');
          else if (value === this.picks[i]) button.classList.add('is-wrong-pick');
          button.disabled = true;
        });
      } else if (verdicts[i] !== 'correct') {
        element?.append(h('span', { class: 'drill-correct' }, `→ ${field.answers[0]}`));
      }
    });

    const feedback = this.root.querySelector<HTMLElement>('.drill-feedback')!;
    const typed = this.inputs[0]?.value ?? '';
    const isDictation = question.audioOnly && question.fields[0]?.kind === 'text';
    feedback.hidden = false;
    feedback.className = `drill-feedback is-${verdict}`;
    const parts: (HTMLElement | null)[] = [
      h('strong', { class: 'drill-verdict' }, VERDICT_TEXT[verdict]),
      isDictation
        ? h(
            'p',
            { class: 'diff' },
            ...diffWords(typed, question.solution).flatMap((token) => [h('span', { class: `diff-${token.kind}` }, token.text), ' ']),
          )
        : h('p', { class: 'drill-solution' }, question.solution, question.audio ? speakButton(question.audio) : null),
      isDictation && question.audio ? h('p', { class: 'drill-solution' }, question.solution, speakButton(question.audio)) : null,
      question.explain ? h('p', { class: 'drill-explain' }, question.explain) : null,
      verdict === 'wrong' && this.queue.length > this.index + 1 ? h('p', { class: 'muted small' }, 'Bunu turun sonunda tekrar soracağım.') : null,
    ];
    feedback.replaceChildren(...parts.filter((part): part is HTMLElement => part !== null));
    this.root.querySelector('[data-testid="drill-check"]')?.setAttribute('hidden', '');
    const next = this.root.querySelector<HTMLButtonElement>('[data-testid="drill-next"]')!;
    next.hidden = false;
    next.focus({ preventScroll: true });
  }

  private next(): void {
    this.index++;
    if (this.index >= this.queue.length) this.renderDone();
    else this.renderQuestion();
  }

  // ---------- Done ----------

  private renderDone(): void {
    const firstTries = this.results;
    const right = firstTries.filter((r) => r.verdict !== 'wrong').length;
    const mistakes = firstTries.filter((r) => r.verdict === 'wrong');
    const percent = firstTries.length ? Math.round((right / firstTries.length) * 100) : 0;
    this.queue = [];
    this.root.replaceChildren(
      this.header(),
      h(
        'section',
        { class: 'drill-done', 'data-testid': 'drill-done' },
        h('div', { class: 'drill-start-icon' }, percent >= 80 ? '🏆' : percent >= 50 ? '💪' : '🌱'),
        h('h2', {}, `${right} / ${firstTries.length} doğru`),
        h('p', { class: 'muted' }, percent >= 80 ? 'Harika gidiyorsun!' : percent >= 50 ? 'İyi, biraz daha pratik.' : 'Tekrar etmeye değer.'),
        mistakes.length
          ? h(
              'div',
              { class: 'drill-mistakes' },
              h('h3', { class: 'phrase-heading' }, 'Hatalar'),
              h('ul', {}, ...mistakes.map((m) => h('li', {}, h('strong', {}, m.question.solution), m.question.explain ? h('span', { class: 'muted' }, ` — ${m.question.explain}`) : null))),
            )
          : null,
        h(
          'div',
          { class: 'button-row' },
          h('button', { type: 'button', class: 'primary', 'data-testid': 'drill-again', onclick: () => void this.begin() }, 'Yeni tur'),
          h('a', { class: 'button', href: href({ name: 'study' }) }, 'Çalış\'a dön'),
        ),
      ),
    );
  }
}
