import type { App } from '../app';
import { loadGrammar, loadStreet } from '../content';
import { pickOfDay } from '../domain/daily';
import { CATEGORY_LABELS } from '../domain/grammar';
import { REGISTER_LABELS, topicPhrases } from '../domain/street';
import { studyDayLabel } from '../scheduling/day';
import { State } from '../scheduling/fsrs';
import { h } from './dom';
import { icon } from './icons';
import { href, navigate } from './router';
import { speakButton } from './tts';
import { countUp } from './motion';
import { loadWeakSpots } from './weakSpots';

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

    // Hero: a progress ring with today's cards, the streak, and one big action.
    const ringSize = 132;
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    const ring = svgRing(ringSize, radius, circumference, percent);
    const centerNumber = h('span', { class: 'ring-number' }, String(remaining > 0 ? remaining : done));

    const allDone = remaining === 0 && done > 0;
    const plan = h(
      'section',
      { class: `today-plan today-hero ${allDone ? 'is-done' : ''}`, 'data-testid': 'today-plan' },
      h(
        'div',
        { class: 'today-head' },
        h('p', { class: 'today-date' }, now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })),
        h('h1', { class: 'today-title' }, greeting(now)),
      ),
      h(
        'div',
        { class: 'hero-row' },
        h(
          'div',
          { class: 'ring', role: 'img', 'aria-label': `Bugünkü ilerleme yüzde ${percent}` },
          ring,
          h('div', { class: 'ring-center' }, allDone ? icon('check') : centerNumber, h('span', { class: 'ring-caption' }, allDone ? 'tamam' : remaining > 0 ? 'kart kaldı' : 'kart')),
        ),
        h(
          'div',
          { class: 'hero-side' },
          h('p', { class: `streak-chip ${stats.streak > 0 ? 'is-on' : ''}` }, icon('flame'), h('strong', {}, String(stats.streak)), ' günlük seri'),
          remaining > 0
            ? h(
                'p',
                { class: 'hero-pills' },
                h('span', { class: 'pill pill-new' }, `${newCount} yeni`),
                h('span', { class: 'pill pill-review' }, `${remaining - newCount} tekrar`),
              )
            : null,
          h('p', { class: 'hero-note' }, remaining > 0 ? `${remaining} kart seni bekliyor` : done > 0 ? `Bugün ${done} kart çalıştın` : 'Bugün tekrar edilecek kart yok'),
        ),
      ),
      remaining > 0
        ? h(
            'button',
            { type: 'button', class: 'primary big hero-start', 'data-testid': 'start-review', onclick: () => navigate({ name: 'review' }) },
            icon('play'),
            done > 0 ? 'Devam et' : 'Başla',
          )
        : h(
            'div',
            { class: 'hero-actions' },
            this.app.hasNewCards()
              ? h(
                  'button',
                  {
                    type: 'button',
                    class: 'primary big',
                    'data-testid': 'today-extra-new',
                    onclick: () => {
                      this.app.addExtraNew(10);
                      navigate({ name: 'review' });
                    },
                  },
                  '+10 yeni kart',
                )
              : null,
            h('a', { class: 'button big', href: href({ name: 'study' }) }, 'Antrenman yap'),
          ),
    );
    if (remaining > 0) countUp(centerNumber, remaining, 600);

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
        placeholder: 'Her şeyde ara: kelime, gramer, kalıp…',
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
            h('p', { class: 'daily-kicker' }, icon('chat'), 'Günün ifadesi'),
            h('p', { class: 'daily-de' }, plain(pick.phrase.de), speakButton(plain(pick.phrase.de))),
            h('p', { class: 'daily-tr' }, pick.phrase.tr),
            h(
              'p',
              { class: 'daily-foot' },
              h('span', { class: `tag r-${pick.phrase.register}` }, REGISTER_LABELS[pick.phrase.register]),
              h('a', { href: href({ name: 'street', id: pick.topic.id }) }, pick.topic.titleTr, icon('arrow')),
            ),
          )
        : null,
      topic
        ? h(
            'a',
            { class: 'daily-card daily-grammar', href: href({ name: 'grammar', id: topic.id }), 'data-testid': 'daily-grammar' },
            h('p', { class: 'daily-kicker' }, icon('book'), weakTopic ? 'Tekrar etmeye değer' : 'Günün gramer konusu'),
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

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 5) return 'İyi geceler';
  if (hour < 12) return 'Günaydın';
  if (hour < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Circular progress ring; the arc animates from empty to `percent`. */
function svgRing(size: number, radius: number, circumference: number, percent: number): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-hidden', 'true');
  const circle = (cls: string) => {
    const c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('cx', String(size / 2));
    c.setAttribute('cy', String(size / 2));
    c.setAttribute('r', String(radius));
    c.setAttribute('class', cls);
    return c;
  };
  const track = circle('ring-track');
  const fill = circle('ring-fill');
  fill.style.strokeDasharray = String(circumference);
  fill.style.strokeDashoffset = String(circumference);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => (fill.style.strokeDashoffset = String(circumference * (1 - percent / 100)))),
  );
  svg.append(track, fill);
  return svg;
}
