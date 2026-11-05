import type { App } from '../app';
import { h } from './dom';

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
