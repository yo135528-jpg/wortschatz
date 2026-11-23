import type { App } from '../app';
import { checkAnswer } from '../domain/answer';
import { clozeAnswers } from '../domain/cloze';
import { typedAnswers } from '../domain/drills';
import { buildHeadword } from '../domain/format';
import type { Note } from '../domain/schema';
import type { CardState } from '../storage/types';
import { BUTTON_GRADES, formatInterval, previewDueDates, type ButtonGrade } from '../scheduling/fsrs';
import { genderClass, renderBack, renderFront } from './cardFaces';
import { h } from './dom';
import { familiesFor, familyOf } from '../domain/families';
import { icon } from './icons';
import { scopeSelect } from './scopeSelect';
import { speakGerman } from './tts';
import { confetti, haptic, pause } from './motion';

/** Where a rated card flies out. */
const FLY: Record<ButtonGrade, string> = { 1: 'left', 2: 'down', 3: 'right', 4: 'up' };
const SWIPE_THRESHOLD = 90;

/** Stable ids for test ids; the visible labels are Turkish. */
const BUTTON_IDS: Record<ButtonGrade, string> = { 1: 'again', 2: 'hard', 3: 'good', 4: 'easy' };
const BUTTON_LABELS: Record<ButtonGrade, string> = { 1: 'Tekrar', 2: 'Zor', 3: 'İyi', 4: 'Kolay' };

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
  /** The options row survives re-renders (every rating rebuilds the screen). */
  private optionsOpen = false;
  /** Card whose German side was already read aloud (re-renders must not repeat it). */
  private spokenKey: string | null = null;
  /** Correct answers in a row (Gut/Leicht), shown as a combo chip. */
  private combo = 0;
  /** The finish confetti runs once per session. */
  private celebrated = false;
  /** Progress of the previous render, so the bar animates from there. */
  private lastPercent = 0;

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
    const previousKey = this.current?.key;
    this.current = preferred ?? (key ? this.app.allStates.find((s) => s.key === key) : undefined) ?? queue[0] ?? null;
    // A card that comes back later (learning step) is read again.
    if (this.current?.key !== previousKey) this.spokenKey = null;
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
    if (this.current?.direction === 'tr2de') this.autoSpeak(this.current);
  }

  /** Reads the headword once per card when the option is on. */
  private autoSpeak(card: CardState): void {
    if (!this.app.settings.autoSpeak || this.spokenKey === card.key) return;
    const note = this.app.notes.get(card.noteId);
    if (!note) return;
    this.spokenKey = card.key;
    void speakGerman(buildHeadword(note).speech);
  }

  private async rate(grade: ButtonGrade): Promise<void> {
    if (!this.current || this.busy) return;
    this.busy = true;
    try {
      this.session[grade]++;
      this.combo = grade >= 3 ? this.combo + 1 : 0;
      haptic(grade === 1 ? [12, 40, 12] : 8);
      // The card leaves in the direction of the answer before the next one comes in.
      const cardElement = this.root.querySelector<HTMLElement>('.card');
      if (cardElement) {
        cardElement.style.transform = '';
        cardElement.classList.add(`fly-${FLY[grade]}`);
        await pause(220);
      }
      // App emits a change event after saving, which calls refresh().
      await this.app.rate(this.current.key, grade);
    } finally {
      this.busy = false;
    }
  }

  /** Swipe on the answer side: right = İyi, left = Tekrar (like a card stack). */
  private attachSwipe(cardElement: HTMLElement): void {
    let startX = 0;
    let startY = 0;
    let dx = 0;
    let tracking = false;
    let horizontal: boolean | null = null;
    const reset = () => {
      cardElement.classList.remove('is-dragging');
      cardElement.style.transform = '';
      cardElement.style.removeProperty('--swipe');
      delete cardElement.dataset.swipe;
    };
    cardElement.addEventListener('pointerdown', (event) => {
      if (!this.flipped || this.busy || (event.target as HTMLElement).closest('button, a, input, summary')) return;
      tracking = true;
      horizontal = null;
      startX = event.clientX;
      startY = event.clientY;
      dx = 0;
    });
    cardElement.addEventListener('pointermove', (event) => {
      if (!tracking) return;
      dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (horizontal === null && Math.hypot(dx, dy) > 8) horizontal = Math.abs(dx) > Math.abs(dy);
      if (!horizontal) return;
      cardElement.classList.add('is-dragging');
      cardElement.style.transform = `translateX(${dx}px) rotate(${dx / 22}deg)`;
      cardElement.style.setProperty('--swipe', String(Math.min(1, Math.abs(dx) / SWIPE_THRESHOLD)));
      cardElement.dataset.swipe = dx > 0 ? 'good' : 'again';
    });
    const end = () => {
      if (!tracking) return;
      tracking = false;
      if (horizontal && Math.abs(dx) >= SWIPE_THRESHOLD) {
        cardElement.classList.remove('is-dragging');
        void this.rate(dx > 0 ? 3 : 1);
      } else reset();
    };
    cardElement.addEventListener('pointerup', end);
    cardElement.addEventListener('pointercancel', () => {
      tracking = false;
      reset();
    });
  }

  private toolbar(remaining: number | null): HTMLElement {
    const { settings } = this.app;
    // Rarely changed options stay folded away, so the card is the first thing on the screen.
    const filtered = Boolean(settings.scope) || settings.typeAnswers;
    const body = h(
        'div',
        { class: 'review-options-body', hidden: !this.optionsOpen },
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
          ' Yazarak cevapla',
        ),
        h(
          'label',
          { class: 'toggle', title: 'Almanca taraf göründüğünde kendiliğinden seslendir' },
          h('input', {
            type: 'checkbox',
            checked: settings.autoSpeak,
            'data-testid': 'auto-speak',
            onchange: (event: Event) => void this.app.updateSettings({ autoSpeak: (event.target as HTMLInputElement).checked }),
          }),
          ' Otomatik seslendir',
        ),
    );
    const optionsButton = h(
      'button',
      {
        type: 'button',
        class: 'undo',
        'data-testid': 'review-options',
        'aria-expanded': String(this.optionsOpen),
        onclick: () => {
          // Toggled in place: a re-render would flip the card back.
          this.optionsOpen = !this.optionsOpen;
          body.hidden = !this.optionsOpen;
          optionsButton.setAttribute('aria-expanded', String(this.optionsOpen));
        },
      },
      filtered ? 'Seçenekler •' : 'Seçenekler',
    );
    return h(
      'div',
      { class: 'review-toolbar' },
      remaining === null ? null : h('span', { class: 'queue-info', 'data-testid': 'remaining' }, `${remaining} kart kaldı`),
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
        icon('undo'),
        'Geri al',
      ),
      optionsButton,
      body,
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
        class: `card card-enter ${card.direction === 'de2tr' ? gender : ''}`,
        'data-testid': 'card',
        'data-direction': card.direction,
        'data-key': card.key,
        role: 'button',
        tabindex: 0,
        'aria-label': 'Kartı çevir',
        onclick: () => (typeInput ? this.checkTyped(note, typeInput) : this.flip()),
      },
      h('span', { class: 'swipe-label swipe-good', 'aria-hidden': 'true' }, 'İYİ'),
      h('span', { class: 'swipe-label swipe-again', 'aria-hidden': 'true' }, 'TEKRAR'),
      h('div', { class: 'card-inner' },
        h('div', { class: 'face face-front', 'data-testid': 'front' }, renderFront(note, card.direction), typeInput),
        h('div', { class: `face face-back ${gender}`, 'data-testid': 'back' }, renderBack(note, card.direction, familyOf(familiesFor(this.app.notes), note))),
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
            'data-testid': `rate-${BUTTON_IDS[grade]}`,
            onclick: () => void this.rate(grade),
          },
          h('span', { class: 'rate-interval' }, formatInterval(now, due[grade])),
          h('span', { class: 'rate-label' }, BUTTON_LABELS[grade]),
          h('kbd', {}, String(grade)),
        ),
      ),
    );

    const done = this.app.reviewedToday(now);
    const percent = Math.round((done / Math.max(1, done + remaining)) * 100);
    const fill = h('div', { class: 'progress-fill', style: `width:${this.lastPercent}%` });
    requestAnimationFrame(() => requestAnimationFrame(() => (fill.style.width = `${percent}%`)));
    this.lastPercent = percent;
    this.attachSwipe(cardElement);
    this.root.append(
      this.toolbar(remaining),
      h(
        'div',
        { class: 'progress thin review-progress', role: 'progressbar', 'aria-label': 'Bugünkü ilerleme', 'aria-valuenow': percent, 'aria-valuemin': 0, 'aria-valuemax': 100 },
        fill,
      ),
      ...(this.combo >= 3 ? [h('p', { class: 'combo', 'data-testid': 'combo' }, icon('flame'), `${this.combo} doğru üst üste`)] : []),
      h('p', { class: 'typed-verdict', 'data-testid': 'typed-verdict', hidden: true }),
      cardElement,
      // Sticky above the tab bar, so the buttons stay under the thumb however long the card is.
      h(
        'div',
        { class: 'review-actions' },
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
        h('p', { class: 'swipe-hint' }, 'Sağa kaydır: İyi · Sola kaydır: Tekrar'),
      ),
    );
    typeInput?.focus({ preventScroll: true });
    if (card.direction === 'de2tr' && this.isVisible()) this.autoSpeak(card);
  }

  private renderEmpty(): HTMLElement {
    const rated = this.session[1] + this.session[2] + this.session[3] + this.session[4];
    if (rated > 0 && !this.celebrated && this.isVisible()) {
      this.celebrated = true;
      haptic([10, 60, 10, 60, 30]);
      requestAnimationFrame(() => confetti());
    }
    const streak = this.app.stats().streak;
    const next = this.app.nextLearningDue();
    if (next) {
      // Re-check automatically when the next learning step becomes due.
      this.waitTimer = window.setTimeout(() => this.refresh(), Math.max(1000, next.getTime() - Date.now()));
    }
    return h(
      'div',
      { class: 'empty', 'data-testid': 'empty' },
      h('div', { class: `empty-icon ${rated > 0 ? 'is-done' : ''}` }, icon('check')),
      h('p', { class: 'empty-title' }, this.app.settings.scope ? 'Bu bölümde bugünlük bu kadar!' : 'Bugünlük bu kadar!'),
      streak > 0 && h('p', { class: 'empty-streak' }, icon('flame'), `${streak} günlük seri`),
      next && h('p', { class: 'muted' }, `Sıradaki öğrenme kartı ${formatInterval(new Date(), next)} sonra.`),
      this.app.hasNewCards() &&
        h(
          'div',
          { class: 'extra-new' },
          h('p', { class: 'muted small' }, 'Daha fazla çalışmak ister misin? Bugüne yeni kart ekle:'),
          ...[10, 20].map((count) =>
            h(
              'button',
              { type: 'button', class: 'button', 'data-testid': `extra-new-${count}`, onclick: () => this.app.addExtraNew(count) },
              `+${count} yeni kart`,
            ),
          ),
        ),
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
