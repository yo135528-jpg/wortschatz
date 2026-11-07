import type { App } from '../app';
import { h } from './dom';
import { clearGeminiCache, GEMINI_VOICES } from './geminiTts';
import {
  currentRate,
  GEMINI_PREFIX,
  geminiKey,
  germanVoices,
  lastSpeechError,
  onVoicesChanged,
  selectedVoice,
  setGeminiKey,
  setRate,
  setVoice,
  speakGerman,
} from './tts';

function numberField(
  label: string,
  testId: string,
  value: number,
  attrs: { min: number; max: number; step: number },
  onChange: (value: number) => void,
): HTMLElement {
  return h(
    'label',
    { class: 'field' },
    h('span', {}, label),
    h('input', {
      type: 'number',
      inputmode: 'decimal',
      value,
      ...attrs,
      'data-testid': testId,
      onchange: (event: Event) => {
        const input = event.target as HTMLInputElement;
        const parsed = Number(input.value);
        if (input.checkValidity() && Number.isFinite(parsed)) onChange(parsed);
        else input.value = String(value);
      },
    }),
  );
}

function downloadText(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = h('a', { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const RATES: [number, string][] = [
  [0.7, 'Yavaş'],
  [0.9, 'Normal'],
  [1, 'Hızlı'],
];
const SAMPLE_SENTENCE = 'Auf echte Freunde kann man sich immer verlassen.';

/** Voice, speed and Gemini key for read-aloud; stored per device, never synced or deployed. */
function speechPanel(): HTMLElement {
  const speechStatus = h('p', { class: 'status', role: 'status', 'data-testid': 'speech-status' });
  const tryVoice = async () => {
    speechStatus.textContent = geminiKey() && selectedVoice().startsWith(GEMINI_PREFIX) ? '⏳ Gemini sesi yükleniyor…' : '';
    await speakGerman(SAMPLE_SENTENCE);
    const error = lastSpeechError();
    speechStatus.textContent = error ? `✗ ${error} Tarayıcı sesi kullanıldı.` : '';
  };

  const voiceSelect = h('select', {
    class: 'voice-select',
    'aria-label': 'Ses',
    'data-testid': 'setting-voice',
    onchange: (event: Event) => {
      setVoice((event.target as HTMLSelectElement).value);
      void tryVoice();
    },
  });
  const fillVoices = () => {
    const selected = selectedVoice();
    const browser = germanVoices();
    const option = (value: string, label: string) => h('option', { value, selected: value === selected }, label);
    voiceSelect.replaceChildren(
      ...(geminiKey()
        ? [h('optgroup', { label: '✨ Yapay zekâ (Gemini)' }, ...GEMINI_VOICES.map(([name, label]) => option(`${GEMINI_PREFIX}${name}`, label)))]
        : []),
      ...(browser.length ? [h('optgroup', { label: 'Tarayıcı sesi' }, ...browser.map((v) => option(v.name, v.name)))] : []),
    );
  };
  fillVoices();
  onVoicesChanged(fillVoices);

  const rateSelect = h(
    'select',
    {
      class: 'voice-select',
      'aria-label': 'Hız',
      onchange: (event: Event) => {
        setRate(Number((event.target as HTMLSelectElement).value));
        void tryVoice();
      },
    },
    ...RATES.map(([value, label]) => h('option', { value, selected: currentRate() === value }, label)),
  );

  const keyInput = h('input', {
    type: 'password',
    class: 'key-input',
    placeholder: 'AI Studio API anahtarı',
    autocomplete: 'off',
    'aria-label': 'Gemini API anahtarı',
    'data-testid': 'setting-gemini-key',
    value: geminiKey() ?? '',
    onchange: (event: Event) => {
      const hadKey = Boolean(geminiKey());
      setGeminiKey((event.target as HTMLInputElement).value);
      // First key: switch to the AI voice right away.
      if (!hadKey && geminiKey()) setVoice(`${GEMINI_PREFIX}${GEMINI_VOICES[0]?.[0] ?? 'Kore'}`);
      fillVoices();
      speechStatus.textContent = geminiKey() ? '✓ Anahtar kaydedildi.' : 'Anahtar silindi.';
    },
  });

  return h(
    'section',
    { class: 'panel' },
    h('h2', {}, 'Sesli okuma'),
    h('label', { class: 'field' }, h('span', {}, 'Gemini anahtarı'), keyInput),
    h('label', { class: 'field' }, h('span', {}, 'Ses'), voiceSelect),
    h('label', { class: 'field' }, h('span', {}, 'Hız'), rateSelect),
    h(
      'div',
      { class: 'button-row' },
      h('button', { type: 'button', onclick: () => void tryVoice() }, '🔊 Dene'),
      h(
        'button',
        {
          type: 'button',
          onclick: async () => {
            await clearGeminiCache();
            speechStatus.textContent = '✓ Ses önbelleği temizlendi.';
          },
        },
        'Önbelleği temizle',
      ),
    ),
    speechStatus,
    h(
      'p',
      { class: 'muted small' },
      'Anahtarı aistudio.google.com/apikey adresinden alırsın. Sadece bu tarayıcıda saklanır, siteye yüklenmez. Her cümle ilk çalışta Gemini\'den gelir (1–3 sn), sonra önbellekten anında çalar. Hata olursa tarayıcı sesi kullanılır.',
    ),
  );
}

export function renderSettings(app: App, root: HTMLElement): void {
  const status = h('p', { class: 'status', role: 'status', 'data-testid': 'backup-status' });
  const { settings } = app;

  const fileInput = h('input', {
    type: 'file',
    accept: 'application/json,.json',
    hidden: true,
    'data-testid': 'import-file',
    onchange: async (event: Event) => {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      try {
        await app.importJson(await file.text());
        status.textContent = '✓ İçe aktarıldı.';
      } catch (error) {
        status.textContent = `✗ ${(error as Error).message}`;
      }
    },
  });

  root.replaceChildren(
    h(
      'section',
      { class: 'panel' },
      h('h2', {}, 'Çalışma'),
      numberField('Günlük yeni kart', 'setting-new', settings.newPerDay, { min: 0, max: 500, step: 1 }, (v) =>
        void app.updateSettings({ newPerDay: v }),
      ),
      numberField('Günlük tekrar limiti', 'setting-reviews', settings.reviewsPerDay, { min: 0, max: 9999, step: 1 }, (v) =>
        void app.updateSettings({ reviewsPerDay: v }),
      ),
      numberField(
        'Hedef hatırlama (0.70–0.99)',
        'setting-retention',
        settings.desiredRetention,
        { min: 0.7, max: 0.99, step: 0.01 },
        (v) => void app.updateSettings({ desiredRetention: v }),
      ),
      h('p', { class: 'muted small' }, 'Yüksek hedef = daha sık tekrar. 0.90 çoğu kişi için iyi bir denge.'),
    ),
    speechPanel(),
    h(
      'section',
      { class: 'panel' },
      h('h2', {}, 'Yedek'),
      h('p', { class: 'muted small' }, 'Tekrar geçmişin sadece bu tarayıcıda durur. Düzenli yedek al; başka cihaza taşımak için de bunu kullan.'),
      h(
        'div',
        { class: 'button-row' },
        h(
          'button',
          {
            type: 'button',
            'data-testid': 'export',
            onclick: async () => {
              const stamp = new Date().toISOString().slice(0, 10);
              downloadText(`wortschatz-backup-${stamp}.json`, await app.exportJson());
              status.textContent = '✓ Dışa aktarıldı.';
            },
          },
          'Dışa aktar',
        ),
        h(
          'button',
          {
            type: 'button',
            'data-testid': 'import',
            onclick: () => {
              if (window.confirm('İçe aktarma bu cihazdaki TÜM tekrar geçmişinin yerine geçer. Devam?')) fileInput.click();
            },
          },
          'İçe aktar',
        ),
      ),
      fileInput,
      status,
    ),
  );
}
