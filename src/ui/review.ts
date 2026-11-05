import type { App } from '../app';
import type { CardState } from '../storage/types';
import { BUTTON_GRADES, formatInterval, previewDueDates, type ButtonGrade } from '../scheduling/fsrs';
import { genderClass, renderBack, renderFront } from './cardFaces';
import { h } from './dom';

const BUTTON_LABELS: Record<ButtonGrade, string> = { 1: 'Again', 2: 'Hard', 3: 'Good', 4: 'Easy' };

/** Review screen: shows the first card of the queue, flips, and rates. */
export class ReviewView {
  private current: CardState | null = null;
  private flipped = false;
  private busy = false;
  private waitTimer: number | undefined;

  constructor(
    private readonly app: App,
    private readonly root: HTMLElement,
  ) {
    document.addEventListener('keydown', (event) => this.onKey(event));
  }

  /** Picks the next card and renders. Called on start, after rating, and on mode change. */
  refresh(): void {
    window.clearTimeout(this.waitTimer);
    this.current = this.app.queue()[0] ?? null;
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
      await this.app.rate(this.current.key, grade);
    } finally {
      this.busy = false;
    }
  }

  private render(): void {
    this.root.replaceChildren();
    const card = this.current;
    if (!card) {
      this.root.append(this.renderEmpty());
      return;
    }
    const note = this.app.notes.get(card.noteId);
    if (!note) return;

    const now = new Date();
    const due = previewDueDates(this.app.getScheduler(), card.fsrs, now);
    const remaining = this.app.queue(now).length;

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
        onclick: () => this.flip(),
      },
      h('div', { class: 'card-inner' },
        h('div', { class: 'face face-front', 'data-testid': 'front' }, renderFront(note, card.direction)),
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
      h('div', { class: 'queue-info', 'data-testid': 'remaining' }, `${remaining} kart kaldı`),
      cardElement,
      h(
        'button',
        { class: 'show-answer', type: 'button', 'data-testid': 'show-answer', onclick: () => this.flip() },
        'Cevabı göster ',
        h('kbd', {}, 'Space'),
      ),
      answerBar,
    );
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
      h('p', {}, 'Bugünlük bu kadar!'),
      next && h('p', { class: 'muted' }, `Sıradaki öğrenme kartı ${formatInterval(new Date(), next)} sonra.`),
    );
  }
}
