import type { App } from '../app';
import { syncWithGist } from '../storage/sync';
import { h } from './dom';

const STORAGE_KEY = 'wortschatz.sync';
/** Automatic syncs (on open / when leaving the app) at most this often. */
const AUTO_INTERVAL_MS = 2 * 60_000;

interface Stored {
  token: string;
  gistId: string | null;
  lastSync: string | null;
}

function read(): Stored {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { token: '', gistId: null, lastSync: null, ...(JSON.parse(raw) as Partial<Stored>) };
  } catch {
    // Unreadable storage: sync is simply off.
  }
  return { token: '', gistId: null, lastSync: null };
}

function write(value: Stored): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Private mode: the token is not remembered.
  }
}

/**
 * Device sync through the learner's own private GitHub Gist.
 * The token stays in this browser only (like the Gemini key).
 */
export class SyncController {
  private running: Promise<void> | null = null;
  private status = '';
  private listeners = new Set<() => void>();

  constructor(
    private readonly app: App,
    /** Called after other devices' reviews were imported (e.g. to rebuild street-phrase notes). */
    private readonly afterImport: () => Promise<void>,
  ) {}

  get enabled(): boolean {
    return read().token !== '';
  }

  /** Syncs on app start and whenever the app goes to the background. */
  startAuto(): void {
    const maybe = () => {
      const { token, lastSync } = read();
      if (!token) return;
      if (lastSync && Date.now() - new Date(lastSync).getTime() < AUTO_INTERVAL_MS) return;
      void this.sync();
    };
    maybe();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') maybe();
    });
  }

  sync(): Promise<void> {
    this.running ??= this.run().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  private async run(): Promise<void> {
    const stored = read();
    if (!stored.token) return;
    this.setStatus('⏳ Senkronize ediliyor…');
    try {
      const result = await syncWithGist({ token: stored.token, gistId: stored.gistId }, await this.app.exportJson());
      if (result.imported) {
        await this.app.importJson(result.imported);
        await this.afterImport();
      }
      const lastSync = new Date().toISOString();
      write({ ...read(), gistId: result.gistId, lastSync });
      this.setStatus(result.imported ? '✓ Diğer cihazdaki tekrarlar alındı.' : '✓ Senkronize edildi.');
    } catch (error) {
      this.setStatus(`✗ ${(error as Error).message}`);
    }
  }

  private setStatus(text: string): void {
    this.status = text;
    this.listeners.forEach((listener) => listener());
  }

  panel(): HTMLElement {
    const stored = read();
    const status = h('p', { class: 'status', role: 'status', 'data-testid': 'sync-status' }, this.status);
    const last = h('p', { class: 'muted small' });
    const renderLast = () => {
      const { lastSync } = read();
      last.textContent = lastSync ? `Son senkron: ${new Date(lastSync).toLocaleString('tr-TR')}` : 'Henüz senkronize edilmedi.';
    };
    renderLast();
    const update = () => {
      status.textContent = this.status;
      renderLast();
    };
    // Only the panel currently on screen listens.
    this.listeners.clear();
    this.listeners.add(update);

    const tokenInput = h('input', {
      type: 'password',
      class: 'key-input',
      placeholder: 'github_pat_…',
      autocomplete: 'off',
      'aria-label': 'GitHub anahtarı',
      'data-testid': 'sync-token',
      value: stored.token,
      onchange: () => {
        const token = tokenInput.value.trim();
        // A new token may belong to another account: forget the old gist id.
        write({ ...read(), token, gistId: token === stored.token ? read().gistId : null });
        if (token) void this.sync();
        else this.setStatus('Senkron kapalı.');
      },
    });

    return h(
      'section',
      { class: 'panel' },
      h('h2', {}, 'Cihazlar arası senkron'),
      h(
        'p',
        { class: 'muted small' },
        'Tekrar geçmişin telefon ve bilgisayar arasında otomatik birleşir. Veriler kendi GitHub hesabındaki gizli bir Gist\'te saklanır. ',
        'github.com/settings/personal-access-tokens adresinden sadece "Gists: Read and write" izni olan bir anahtar oluştur ve iki cihaza da gir.',
      ),
      h('label', { class: 'field' }, h('span', {}, 'GitHub anahtarı'), tokenInput),
      h(
        'div',
        { class: 'button-row' },
        h('button', { type: 'button', 'data-testid': 'sync-now', onclick: () => void this.sync() }, '🔄 Şimdi senkronize et'),
      ),
      status,
      last,
      h(
        'p',
        { class: 'muted small' },
        'Anahtar sadece bu tarayıcıda durur. Uygulama açılınca ve arka plana geçince kendiliğinden senkronize eder.',
      ),
    );
  }
}
