import './styles/main.css';
import rawNotes from './data/cards.json';
import { App } from './app';
import { loadGrammar, loadRedemittel, loadStories, loadStreet } from './content';
import { isStoryKey, storyKey, storyNote, storyNotes } from './domain/stories';
import { StoriesView } from './ui/stories';
import { parseNotes } from './domain/schema';
import { sortByBook } from './domain/scope';
import { openDatabase } from './storage/db';
import type { StudyMode } from './storage/types';
import { BrowserView } from './ui/browser';
import { FamiliesView } from './ui/families';
import { byId, h } from './ui/dom';
import { GrammarView } from './ui/grammar';
import { RedemittelView, type RedemittelCardActions } from './ui/redemittel';
import { ReviewView } from './ui/review';
import { parseRoute, routeHash, tabOf, type Route, type RouteName } from './ui/router';
import { SearchView } from './ui/search';
import { renderSettings } from './ui/settings';
import { renderStats } from './ui/stats';
import { StreetView, type StreetCardActions } from './ui/street';
import { phraseKey, streetNote, streetNotes } from './domain/streetCards';
import { isRedemittelKey, redemittelKey, redemittelNote, redemittelNotes } from './domain/redemittelCards';
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
  'families',
  'grammar',
  'street',
  'phrases',
  'stories',
  'search',
  'progress',
  'settings',
];
const LIBRARY: RouteName[] = ['words', 'families', 'grammar', 'street', 'phrases', 'stories'];

async function start(): Promise<void> {
  // Study order: per chapter Kursbuch first, then Arbeitsbuch (cards.json is in the order pages were added).
  const notes = sortByBook(parseNotes(rawNotes));
  const app = await App.load(await openDatabase(), notes);
  // Street-German phrases the learner added as cards are rebuilt from the content.
  const loadStreetCards = async () => {
    const keys = app.settings.streetPhrases;
    const day = studyDayLabel(new Date());
    // The list holds street phrases and (prefixed) Redemittel; each content chunk is loaded only when needed.
    const isStreet = (key: string) => !isRedemittelKey(key) && !isStoryKey(key);
    const street = keys.some(isStreet) ? streetNotes(await loadStreet(), keys, day) : [];
    const phrases = keys.some(isRedemittelKey) ? redemittelNotes(await loadRedemittel(), keys, day) : [];
    const words = keys.some(isStoryKey) ? storyNotes(await loadStories(), keys, day) : [];
    await app.addNotes([...street, ...phrases, ...words].filter((note) => !app.notes.has(note.id)));
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

  const phraseCards: RedemittelCardActions = {
    has: (group, item) => app.settings.streetPhrases.includes(redemittelKey(group, item)),
    async toggle(group, item) {
      const key = redemittelKey(group, item);
      const note = redemittelNote(group, item, studyDayLabel(new Date()));
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

  const storyCards = {
    notes: () => app.notes.values(),
    has: (story: Parameters<typeof storyKey>[0], lemma: string) => app.settings.streetPhrases.includes(storyKey(story, lemma)),
    async add(story: Parameters<typeof storyKey>[0], lemma: string) {
      const key = storyKey(story, lemma);
      if (app.settings.streetPhrases.includes(key)) return;
      const entry = story.glossary.find((e) => String(e.lemma).toLowerCase() === lemma.toLowerCase());
      if (!entry) return;
      await app.updateSettings({ streetPhrases: [...app.settings.streetPhrases, key] });
      await app.addNotes([storyNote(story, entry, studyDayLabel(new Date()))]);
    },
  };

  const views = Object.fromEntries(VIEW_NAMES.map((name) => [name, byId(`view-${name}`)])) as Record<ViewName, HTMLElement>;
  const today = new TodayView(app, views.today);
  const study = new StudyView(app, views.study, STUDY_ITEMS);
  const review = new ReviewView(app, views.review);
  const drill = new DrillView(app, views.drill);
  const browser = new BrowserView(app, views.words);
  const families = new FamiliesView(app, views.families);
  const search = new SearchView(app, views.search);
  // Reference content is loaded lazily on first visit (separate chunks).
  let grammar: Promise<GrammarView> | null = null;
  let street: Promise<StreetView> | null = null;
  let phrases: Promise<RedemittelView> | null = null;
  let stories: Promise<StoriesView> | null = null;
  const storiesView = () => (stories ??= loadStories().then((list) => new StoriesView(list, views.stories, storyCards)));
  const phrasesView = () => (phrases ??= loadRedemittel().then((groups) => new RedemittelView(groups, views.phrases, phraseCards)));
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
      // Verb families are a sub-screen of the word list.
      link.setAttribute('aria-current', String(link.dataset.lib === (next.name === 'families' ? 'words' : next.name)));
    });
    // The settings link exists only in the wide-screen side rail.
    const tab = next.name === 'settings' ? 'settings' : tabOf(next);
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
      case 'families':
        families.show(next.stem);
        break;
      case 'grammar':
        (await grammarView()).show(next.id);
        break;
      case 'street':
        (await streetView()).show(next.id);
        break;
      case 'phrases':
        (await phrasesView()).show(next.id);
        break;
      case 'stories':
        (await storiesView()).show(next.id);
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
