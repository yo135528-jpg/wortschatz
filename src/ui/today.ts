import type { App } from '../app';
import { loadGrammar, loadStreet } from '../content';
import { pickOfDay } from '../domain/daily';
import { CATEGORY_LABELS } from '../domain/grammar';
import { REGISTER_LABELS, topicPhrases } from '../domain/street';
import { studyDayLabel } from '../scheduling/day';
import { State } from '../scheduling/fsrs';
import { h } from './dom';
import { href, navigate } from './router';
import { speakButton } from './tts';
import { loadWeakSpots } from './weakSpots';

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 11) return 'Günaydın';
  if (hour < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

/** Home screen: what to do today, plus a phrase and a grammar topic of the day. */
export class TodayView {
  /** Daily picks are async (lazy content) and change once per day, so they are cached per day. */
  private daily: { label: string; node: HTMLElement } | null = null;

  constructor(
    private readonly app: App,
    private readonly root: HTMLElement,
  ) {}

  refresh(): void {
    const now = new Date();
    const queue = this.app.queue(now);
    const done = this.app.reviewedToday(now);
    const remaining = queue.length;
    const newCount = queue.filter((s) => s.fsrs.state === State.New).length;
    const stats = this.app.stats(now);
    const total = done + remaining;
    const percent = total === 0 ? 100 : Math.round((done / total) * 100);

    const plan = h(
      'section',
      { class: 'today-plan', 'data-testid': 'today-plan' },
      h('p', { class: 'today-greeting' }, `${greeting(now)} 👋`),
      remaining > 0
        ? h(
            'h2',
            {},
            `Bugün ${remaining} kart seni bekliyor`,
            newCount ? h('span', { class: 'today-sub' }, ` · ${newCount} yeni`) : null,
          )
        : h('h2', {}, done > 0 ? 'Bugünlük kartlar bitti 🎉' : 'Bugün tekrar edilecek kart yok'),
      h(
        'div',
        { class: 'progress', role: 'progressbar', 'aria-valuenow': percent, 'aria-valuemin': 0, 'aria-valuemax': 100 },
        h('div', { class: 'progress-fill', style: `width:${percent}%` }),
      ),
      h('p', { class: 'today-meta' }, `${done} kart çalışıldı · 🔥 ${stats.streak} günlük seri`),
      remaining > 0
        ? h(
            'button',
            { type: 'button', class: 'primary big', 'data-testid': 'start-review', onclick: () => navigate({ name: 'review' }) },
            'Çalışmaya başla',
          )
        : h('a', { class: 'button big', href: href({ name: 'study' }) }, 'Antrenman yap'),
    );

    const search = h(
      'form',
      {
        class: 'today-search',
        role: 'search',
        onsubmit: (event: Event) => {
          event.preventDefault();
          const query = (event.currentTarget as HTMLFormElement).querySelector('input')!.value.trim();
          if (query) navigate({ name: 'search', query });
        },
      },
      h('input', {
        type: 'search',
        class: 'search',
        name: 'q',
        placeholder: 'Her şeyde ara: kelime, gramer, sokak dili…',
        'aria-label': 'Her şeyde ara',
        'data-testid': 'global-search',
      }),
    );

    const label = studyDayLabel(now);
    if (this.daily?.label !== label) {
      this.daily = { label, node: h('div', { class: 'today-daily' }) };
      void this.fillDaily(this.daily.node, label);
    }
    this.root.replaceChildren(plan, search, this.daily.node);
  }

  private async fillDaily(target: HTMLElement, label: string): Promise<void> {
    const [street, grammar] = await Promise.all([loadStreet(), loadGrammar()]);
    const phrases = street.flatMap((topic) =>
      topicPhrases(topic)
        // Keep the daily phrase broadly usable: no swearing.
        .filter((phrase) => phrase.register !== 'derb')
        .map((phrase) => ({ topic, phrase })),
    );
    const pick = pickOfDay(phrases, label);
    // A grammar topic the learner keeps getting wrong beats a random one.
    const weakIds = (await loadWeakSpots(5)).flatMap((spot) => (spot.route.name === 'grammar' && spot.route.id ? [spot.route.id] : []));
    const weakTopic = grammar.find((t) => t.id === weakIds[0]);
    // Otherwise stay at the learner's level: A1/A2 topics are reference, not daily material.
    const atLevel = grammar.filter((t) => t.level === 'B1' || t.level === 'B2');
    const topic = weakTopic ?? pickOfDay(atLevel.length ? atLevel : grammar, label, 7);
    const plain = (value: string) => value.replaceAll('**', '');

    const cards: (HTMLElement | null)[] = [
      pick
        ? h(
            'section',
            { class: 'daily-card daily-street', 'data-testid': 'daily-phrase' },
            h('p', { class: 'daily-kicker' }, '💬 Günün ifadesi'),
            h('p', { class: 'daily-de' }, plain(pick.phrase.de), speakButton(plain(pick.phrase.de))),
            h('p', { class: 'daily-tr' }, pick.phrase.tr),
            h(
              'p',
              { class: 'daily-foot' },
              h('span', { class: `tag r-${pick.phrase.register}` }, REGISTER_LABELS[pick.phrase.register]),
              h('a', { href: href({ name: 'street', id: pick.topic.id }) }, `${pick.topic.icon} ${pick.topic.titleTr} →`),
            ),
          )
        : null,
      topic
        ? h(
            'a',
            { class: 'daily-card daily-grammar', href: href({ name: 'grammar', id: topic.id }), 'data-testid': 'daily-grammar' },
            h('p', { class: 'daily-kicker' }, weakTopic ? '📖 Tekrar etmeye değer' : '📖 Günün gramer konusu'),
            h('p', { class: 'daily-de' }, topic.titleDe),
            h('p', { class: 'daily-tr' }, topic.titleTr),
            h(
              'p',
              { class: 'daily-foot' },
              h('span', { class: `level level-${topic.level}` }, topic.level),
              h('span', { class: `tag c-${topic.category}` }, CATEGORY_LABELS[topic.category]),
            ),
          )
        : null,
    ];
    target.replaceChildren(...cards.filter((card): card is HTMLElement => card !== null));
  }
}
