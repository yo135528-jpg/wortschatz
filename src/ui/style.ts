/**
 * Visual style (palette, shapes, type) on top of light/dark. Per device, like the theme:
 * stored in localStorage and applied by index.html before the first paint.
 */
export type Style = 'ios' | 'pastel' | 'kagit' | 'oyun' | 'gece' | 'mono' | 'okyanus';

export const STYLE_KEY = 'wortschatz.style';

export interface StyleInfo {
  label: string;
  description: string;
  /** Preview swatch colours (light): background, surface, accent, second accent. */
  preview: [string, string, string, string];
}

export const STYLES: Record<Style, StyleInfo> = {
  ios: { label: 'Sade (iOS)', description: 'Temiz, gri zemin, mavi vurgu', preview: ['#f2f2f7', '#ffffff', '#0a66d8', '#23894e'] },
  pastel: { label: 'Pastel', description: 'Yumuşak mor tonlar, yuvarlak hatlar', preview: ['#f5f2ff', '#ffffff', '#7048e8', '#f0a6ca'] },
  kagit: { label: 'Kâğıt', description: 'Sıcak kâğıt rengi, kitap gibi serif başlıklar', preview: ['#f4efe6', '#fffdf8', '#b5541c', '#5b7a4a'] },
  oyun: { label: 'Oyun', description: 'Canlı yeşil, tok basılan kalın düğmeler', preview: ['#ffffff', '#f7f7f7', '#58a700', '#1cb0f6'] },
  gece: { label: 'Gece', description: 'Koyu lacivert, mor-turkuaz ışıltı', preview: ['#0b0f1a', '#151b2e', '#8b5cf6', '#22d3ee'] },
  mono: { label: 'Mono', description: 'Siyah-beyaz, keskin ve minimal', preview: ['#fafafa', '#ffffff', '#111111', '#777777'] },
  okyanus: { label: 'Okyanus', description: 'Turkuaz geçişli zemin, buzlu cam kartlar', preview: ['#dff3f4', '#ffffff', '#0e8a96', '#2f62d8'] },
};

const IDS = Object.keys(STYLES) as Style[];

export function currentStyle(): Style {
  try {
    const stored = localStorage.getItem(STYLE_KEY) as Style | null;
    return stored && IDS.includes(stored) ? stored : 'ios';
  } catch {
    return 'ios';
  }
}

export function applyStyle(style: Style): void {
  const root = document.documentElement;
  if (style === 'ios') delete root.dataset.style;
  else root.dataset.style = style;
}

export function setStyle(style: Style): void {
  try {
    if (style === 'ios') localStorage.removeItem(STYLE_KEY);
    else localStorage.setItem(STYLE_KEY, style);
  } catch {
    // Private mode: applies for this visit only.
  }
  applyStyle(style);
}
