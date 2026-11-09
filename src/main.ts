import './styles/main.css';
import rawNotes from './data/cards.json';
import { App } from './app';
import { loadGrammar, loadStreet } from './content';
import { parseNotes } from './domain/schema';
import { openDatabase } from './storage/db';
import type { StudyMode } from './storage/types';
import { BrowserView } from './ui/browser';
import { byId, h } from './ui/dom';
import { GrammarView } from './ui/grammar';
import { ReviewView } from './ui/review';
import { parseRoute, routeHash, tabOf, type Route, type RouteName } from './ui/router';
import { SearchView } from './ui/search';
import { renderSettings } from './ui/settings';
import { renderStats } from './ui/stats';
import { StreetView, type StreetCardActions } from './ui/street';
import { phraseKey, streetNote, streetNotes } from './domain/streetCards';
import { studyDayLabel } from './scheduling/day';
import { StudyView } from './ui/study';
import { STUDY_ITEMS } from './ui/studyItems';
import { DrillView } from './ui/drill';
import { TodayView } from './ui/today';
import { SyncController } from './ui/sync';
import { registerServiceWorker } from './pwa';

type ViewName = Exclude<RouteName, never>;
const VIEW_NAMES: ViewName[] = [
  'today',
  'study',
  'review',
  'drill',
  'words',
  'grammar',
  'street',
  'search',
  'progress',
  'settings',
];
const LIBRARY: RouteName[] = ['words', 'grammar', 'street'];

async function start(): Promise<void> {
  const notes = parseNotes(rawNotes);
  const app = await App.load(await openDatabase(), notes);
  // Street-German phrases the learner added as cards are rebuilt from the content.
  const loadStreetCards = async () => {
    const missing = app.settings.streetPhrases.length
      ? streetNotes(await loadStreet(), app.settings.streetPhrases, studyDayLabel(new Date())).filter((n) => !app.notes.has(n.id))
      : [];
    await app.addNotes(missing);
  };
  await loadStreetCards();
  const sync = new SyncController(app, loadStreetCards);
  const streetCards: StreetCardActions = {
    has: (topic, phrase) => app.settings.streetPhrases.includes(phraseKey(topic, phrase)),
    async toggle(topic, phrase) {
      const key = phraseKey(topic, phrase);
      const note = streetNote(topic, phrase, studyDayLabel(new Date()));
      if (app.settings.streetPhrases.includes(key)) {
        await app.updateSettings({ streetPhrases: app.settings.streetPhrases.filter((k) => k !== key) });
        app.removeNotes([note.id]);
        return false;
      }
      await app.updateSettings({ streetPhrases: [...app.settings.streetPhrases, key] });
      await app.addNotes([note]);
      return true;
    },
  };

  const views = Object.fromEntries(VIEW_NAMES.map((name) => [name, byId(`view-${name}`)])) as Record<ViewName, HTMLElement>;
  const today = new TodayView(app, views.today);
  const study = new StudyView(app, views.study, STUDY_ITEMS);
  const review = new ReviewView(app, views.review);
  const drill = new DrillView(app, views.drill);
  const browser = new BrowserView(app, views.words);
  const search = new SearchView(app, views.search);
  // Reference content is loaded lazily on first visit (separate chunks).
  let grammar: Promise<GrammarView> | null = null;
  let street: Promise<StreetView> | null = null;
  const grammarView = () => (grammar ??= loadGrammar().then((topics) => new GrammarView(topics, views.grammar, notes)));
  const streetView = () => (street ??= loadStreet().then((topics) => new StreetView(topics, views.street, streetCards)));

  const modeToggle = byId('mode-toggle');
  const libraryNav = byId('library-nav');
  const libraryTab = document.querySelector<HTMLAnchorElement>('[data-tab="library"]')!;
  let route: Route = parseRoute(location.hash);

  /** Re-renders the visible screen with fresh state (after a rating, settings change …). */
  const renderActive = () => {
    switch (route.name) {
      case 'today':
        return today.refresh();
      case 'study':
        return study.refresh();
      case 'words':
        return browser.refresh();
      case 'progress':
        return renderStats(app, views.progress);
      default:
        return undefined;
    }
  };

  const show = async (next: Route) => {
    const previous = route;
    route = next;
    for (const name of VIEW_NAMES) views[name].hidden = name !== next.name;
    modeToggle.hidden = next.name !== 'review';
    libraryNav.hidden = !LIBRARY.includes(next.name);
    libraryNav.querySelectorAll<HTMLAnchorElement>('[data-lib]').forEach((link) => {
      link.setAttribute('aria-current', String(link.dataset.lib === next.name));
    });
    const tab = tabOf(next);
    document.querySelectorAll<HTMLAnchorElement>('[data-tab]').forEach((link) => {
      link.setAttribute('aria-current', String(link.dataset.tab === tab));
    });
    // The library tab reopens the last library screen.
    if (LIBRARY.includes(next.name)) libraryTab.href = routeHash(next.name === 'words' ? { name: 'words', id: null } : next);
    if (previous.name !== next.name) window.scrollTo({ top: 0 });

    switch (next.name) {
      case 'review':
        review.refresh();
        break;
      case 'drill':
        drill.show(next.kind);
        break;
      case 'words':
        browser.focus(next.id);
        break;
      case 'grammar':
        (await grammarView()).show(next.id);
        break;
      case 'street':
        (await streetView()).show(next.id);
        break;
      case 'search':
        search.show(next.query);
        break;
      case 'settings':
        renderSettings(app, views.settings, [sync.panel()]);
        break;
      default:
        renderActive();
    }
  };

  window.addEventListener('hashchange', () => void show(parseRoute(location.hash)));

  // Mode toggle: filters the queue only; schedules stay separate per direction.
  const modeButtons = document.querySelectorAll<HTMLButtonElement>('[data-mode]');
  const syncMode = () =>
    modeButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === app.settings.mode)));
  modeButtons.forEach((button) => {
    button.addEventListener('click', () => void app.updateSettings({ mode: button.dataset.mode as StudyMode }));
  });

  app.onChange(() => {
    syncMode();
    if (route.name === 'review') review.refresh();
    else renderActive();
  });

  syncMode();
  await show(route);
  // Signals that all event handlers are attached (used by e2e tests).
  document.body.dataset.ready = 'true';
  registerServiceWorker();
  sync.startAuto();
}

start().catch((error: Error) => {
  console.error(error);
  document.body.replaceChildren(h('pre', { class: 'fatal' }, error.message));
});
