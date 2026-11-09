import type { App } from '../app';
import { checkAnswer } from '../domain/answer';
import { clozeAnswers } from '../domain/cloze';
import { typedAnswers } from '../domain/drills';
import type { Note } from '../domain/schema';
import type { CardState } from '../storage/types';
import { BUTTON_GRADES, formatInterval, previewDueDates, type ButtonGrade } from '../scheduling/fsrs';
import { genderClass, renderBack, renderFront } from './cardFaces';
import { h } from './dom';
import { scopeSelect } from './scopeSelect';

const BUTTON_LABELS: Record<ButtonGrade, string> = { 1: 'Again', 2: 'Hard', 3: 'Good', 4: 'Easy' };

/** Review screen: shows the first card of the queue, flips, and rates. */
export class ReviewView {
  private current: CardState | null = null;
  private flipped = false;
  private busy = false;
  private waitTimer: number | undefined;
  /** After an undo, show exactly that card again. */
  private preferKey: string | null = null;
  /** Ratings in this session (since the app was opened), for the summary. */
  private session: Record<ButtonGrade, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

  constructor(
    private readonly app: App,
    private readonly root: HTMLElement,
  ) {
    document.addEventListener('keydown', (event) => this.onKey(event));
  }

  /** Picks the next card and renders. Called on start, after rating, and on mode change. */
  refresh(): void {
    window.clearTimeout(this.waitTimer);
    const queue = this.app.queue();
    const preferred = this.preferKey ? queue.find((state) => state.key === this.preferKey) : undefined;
    const key = this.preferKey;
    this.preferKey = null;
    this.current = preferred ?? (key ? this.app.allStates.find((s) => s.key === key) : undefined) ?? queue[0] ?? null;
    this.flipped = false;
    this.render();
  }

  private isVisible(): boolean {
    return !this.root.hidden;
  }

  private onKey(event: KeyboardEvent): void {
    if (!this.isVisible() || !this.current) return;
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select')) return;
    if ((event.key === 'z' || event.key === 'Z') && !event.altKey) {
      event.preventDefault();
      void this.undo();
      return;
    }

    if ((event.code === 'Space' || event.key === 'Enter') && !this.flipped) {
      event.preventDefault();
      this.flip();
      return;
    }
    const grade = Number(event.key);
    if (this.flipped && grade >= 1 && grade <= 4) {
      event.preventDefault();
      void this.rate(grade as ButtonGrade);
    }
  }

  /** Checks the typed tr2de answer, then flips and pre-selects the matching rating. */
  private checkTyped(note: Note, input: HTMLInputElement): void {
    if (this.flipped) return;
    const accepted = [...(note.cloze ? [clozeAnswers(note.cloze).join(' ')] : []), ...typedAnswers(note)];
    const verdict = checkAnswer(input.value, accepted);
    input.readOnly = true;
    const banner = this.root.querySelector<HTMLElement>('.typed-verdict');
    if (banner) {
      banner.hidden = false;
      banner.className = `typed-verdict is-${verdict}`;
      banner.textContent =
        verdict === 'correct' ? '✓ Doğru' : verdict === 'almost' ? `≈ Neredeyse: „${input.value}"` : `✗ Senin cevabın: „${input.value || '—'}"`;
    }
    this.flip();
    const suggested = verdict === 'correct' ? 3 : verdict === 'almost' ? 2 : 1;
    this.root.querySelector<HTMLButtonElement>(`.rate-${suggested}`)?.focus({ preventScroll: true });
  }

  private async undo(): Promise<void> {
    if (!this.app.canUndo || this.busy) return;
    const key = await this.app.undo();
    if (key) {
      this.preferKey = key;
      this.refresh();
    }
  }

  private flip(): void {
    if (this.flipped) return;
    this.flipped = true;
    this.root.querySelector('.card')?.classList.add('is-flipped');
    this.root.querySelector('.answer-bar')?.removeAttribute('hidden');
    this.root.querySelector('.show-answer')?.setAttribute('hidden', '');
    this.root.querySelector<HTMLButtonElement>('.rate-3')?.focus({ preventScroll: true });
  }

  private async rate(grade: ButtonGrade): Promise<void> {
    if (!this.current || this.busy) return;
    this.busy = true;
    try {
      // App emits a change event after saving, which calls refresh().
      this.session[grade]++;
      await this.app.rate(this.current.key, grade);
    } finally {
      this.busy = false;
    }
  }

  private toolbar(remaining: number | null): HTMLElement {
    const { settings } = this.app;
    return h(
      'div',
      { class: 'review-toolbar' },
      scopeSelect(this.app.notes.values(), settings.scope, (scope) => void this.app.updateSettings({ scope }), 'review-scope'),
      h(
        'label',
        { class: 'toggle', title: 'TR→DE kartlarında cevabı yazarak ver' },
        h('input', {
          type: 'checkbox',
          checked: settings.typeAnswers,
          'data-testid': 'type-answers',
          onchange: (event: Event) => void this.app.updateSettings({ typeAnswers: (event.target as HTMLInputElement).checked }),
        }),
        ' ⌨️ Yazarak',
      ),
      h(
        'button',
        {
          type: 'button',
          class: 'undo',
          'data-testid': 'undo',
          disabled: !this.app.canUndo,
          title: 'Son değerlendirmeyi geri al (Z)',
          onclick: () => void this.undo(),
        },
        '↶ Geri al',
      ),
      remaining === null ? null : h('span', { class: 'queue-info', 'data-testid': 'remaining' }, `${remaining} kart kaldı`),
    );
  }

  private render(): void {
    this.root.replaceChildren();
    const card = this.current;
    if (!card) {
      this.root.append(this.toolbar(null), this.renderEmpty());
      return;
    }
    const note = this.app.notes.get(card.noteId);
    if (!note) return;

    const now = new Date();
    const due = previewDueDates(this.app.getScheduler(), card.fsrs, now);
    const remaining = this.app.queue(now).length;

    const typeInput =
      this.app.settings.typeAnswers && card.direction === 'tr2de'
        ? h('input', {
            type: 'text',
            class: 'drill-input type-input',
            placeholder: 'Almancasını yaz, Enter…',
            autocomplete: 'off',
            autocapitalize: 'off',
            spellcheck: 'false',
            lang: 'de',
            'data-testid': 'type-input',
            // Typing must not flip the card.
            onclick: (event: Event) => event.stopPropagation(),
            onkeydown: (event: Event) => {
              if ((event as KeyboardEvent).key !== 'Enter') return;
              event.preventDefault();
              if (!this.flipped) this.checkTyped(note, typeInput!);
            },
          })
        : null;

    // On tr2de the gender color would leak the answer, so it only appears on the back.
    const gender = genderClass(note);
    const cardElement = h(
      'div',
      {
        class: `card ${card.direction === 'de2tr' ? gender : ''}`,
        'data-testid': 'card',
        'data-direction': card.direction,
        'data-key': card.key,
        role: 'button',
        tabindex: 0,
        'aria-label': 'Kartı çevir',
        onclick: () => (typeInput ? this.checkTyped(note, typeInput) : this.flip()),
      },
      h('div', { class: 'card-inner' },
        h('div', { class: 'face face-front', 'data-testid': 'front' }, renderFront(note, card.direction), typeInput),
        h('div', { class: `face face-back ${gender}`, 'data-testid': 'back' }, renderBack(note, card.direction)),
      ),
    );

    const answerBar = h(
      'div',
      { class: 'answer-bar', hidden: true },
      ...BUTTON_GRADES.map((grade) =>
        h(
          'button',
          {
            class: `rate rate-${grade}`,
            type: 'button',
            'data-testid': `rate-${BUTTON_LABELS[grade].toLowerCase()}`,
            onclick: () => void this.rate(grade),
          },
          h('span', { class: 'rate-interval' }, formatInterval(now, due[grade])),
          h('span', { class: 'rate-label' }, BUTTON_LABELS[grade]),
          h('kbd', {}, String(grade)),
        ),
      ),
    );

    this.root.append(
      this.toolbar(remaining),
      h('p', { class: 'typed-verdict', 'data-testid': 'typed-verdict', hidden: true }),
      cardElement,
      h(
        'button',
        {
          class: 'show-answer',
          type: 'button',
          'data-testid': 'show-answer',
          onclick: () => (typeInput ? this.checkTyped(note, typeInput) : this.flip()),
        },
        typeInput ? 'Kontrol et ' : 'Cevabı göster ',
        h('kbd', {}, typeInput ? 'Enter' : 'Space'),
      ),
      answerBar,
    );
    typeInput?.focus({ preventScroll: true });
  }

  private renderEmpty(): HTMLElement {
    const next = this.app.nextLearningDue();
    if (next) {
      // Re-check automatically when the next learning step becomes due.
      this.waitTimer = window.setTimeout(() => this.refresh(), Math.max(1000, next.getTime() - Date.now()));
    }
    return h(
      'div',
      { class: 'empty', 'data-testid': 'empty' },
      h('div', { class: 'empty-icon' }, '🎉'),
      h('p', {}, this.app.settings.scope ? 'Bu bölümde bugünlük bu kadar!' : 'Bugünlük bu kadar!'),
      next && h('p', { class: 'muted' }, `Sıradaki öğrenme kartı ${formatInterval(new Date(), next)} sonra.`),
      this.renderSessionSummary(),
    );
  }

  /** Counts of this session's ratings; hidden before the first rating. */
  private renderSessionSummary(): HTMLElement | null {
    const total = this.session[1] + this.session[2] + this.session[3] + this.session[4];
    if (total === 0) return null;
    const known = this.session[3] + this.session[4];
    return h(
      'div',
      { class: 'session-summary', 'data-testid': 'session-summary' },
      h('p', { class: 'session-title' }, `Bu oturum: ${total} kart · %${Math.round((known / total) * 100)} rahat bildin`),
      h(
        'div',
        { class: 'session-bars' },
        ...BUTTON_GRADES.map((grade) =>
          h('span', { class: `session-pill rate-${grade}` }, `${BUTTON_LABELS[grade]} ${this.session[grade]}`),
        ),
      ),
      h('a', { class: 'button', href: '#/study' }, 'Antrenmanlara geç'),
    );
  }
}
