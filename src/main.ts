import './styles/main.css';
import rawNotes from './data/cards.json';
import { App } from './app';
import { parseNotes } from './domain/schema';
import { openDatabase } from './storage/db';
import type { StudyMode } from './storage/types';
import { BrowserView } from './ui/browser';
import { GRAMMAR_TOPICS } from './data/grammar';
import { parseGrammar } from './domain/grammar';
import { GrammarView } from './ui/grammar';
import { byId, h } from './ui/dom';
import { ReviewView } from './ui/review';
import { renderSettings } from './ui/settings';
import { renderStats } from './ui/stats';

type Tab = 'review' | 'browse' | 'grammar' | 'stats' | 'settings';
const TABS: Tab[] = ['review', 'browse', 'grammar', 'stats', 'settings'];

async function start(): Promise<void> {
  const notes = parseNotes(rawNotes);
  const app = await App.load(await openDatabase(), notes);

  const views = Object.fromEntries(TABS.map((tab) => [tab, byId(`view-${tab}`)])) as Record<Tab, HTMLElement>;
  const review = new ReviewView(app, views.review);
  const browser = new BrowserView(app, views.browse);
  // Static reference content: rendered once, independent of review state.
  new GrammarView(parseGrammar(GRAMMAR_TOPICS), views.grammar);
  let activeTab: Tab = 'review';

  const renderActive = () => {
    if (activeTab === 'browse') browser.refresh();
    if (activeTab === 'stats') renderStats(app, views.stats);
  };

  const showTab = (tab: Tab) => {
    activeTab = tab;
    for (const name of TABS) views[name].hidden = name !== tab;
    document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
      button.setAttribute('aria-current', String(button.dataset.tab === tab));
    });
    if (tab === 'settings') renderSettings(app, views.settings);
    renderActive();
  };

  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => showTab(button.dataset.tab as Tab));
  });

  // Mode toggle: filters the queue only; schedules stay separate per direction.
  const modeButtons = document.querySelectorAll<HTMLButtonElement>('[data-mode]');
  const syncMode = () =>
    modeButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === app.settings.mode)));
  modeButtons.forEach((button) => {
    button.addEventListener('click', () => void app.updateSettings({ mode: button.dataset.mode as StudyMode }));
  });

  app.onChange(() => {
    syncMode();
    review.refresh();
    renderActive();
  });

  syncMode();
  review.refresh();
  showTab('review');
  // Signals that all event handlers are attached (used by e2e tests).
  document.body.dataset.ready = 'true';
}

start().catch((error: Error) => {
  console.error(error);
  document.body.replaceChildren(h('pre', { class: 'fatal' }, error.message));
});
