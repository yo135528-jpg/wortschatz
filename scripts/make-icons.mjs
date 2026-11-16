// Renders the app icons (public/icons/*.png) from one HTML template with headless Chromium.
// Usage: node scripts/make-icons.mjs
import { chromium } from '@playwright/test';

const OUT = new URL('../public/icons/', import.meta.url);

/** `bleed`: maskable icons fill the whole square and keep the glyph inside the safe zone. */
const html = (size, { bleed, rounded }) => `
<style>
  html, body { margin: 0; background: transparent; }
  .icon {
    position: relative;
    width: ${size}px; height: ${size}px;
    border-radius: ${rounded ? size * 0.22 : 0}px;
    background: linear-gradient(135deg, #2f62d8 0%, #6a4fd0 55%, #b03a86 115%);
    font-family: 'Segoe UI', system-ui, Arial, sans-serif;
    color: #fff;
  }
  .letter {
    position: absolute; inset: 0;
    display: grid; place-items: center;
    font-size: ${size * (bleed ? 0.46 : 0.6)}px; font-weight: 900; line-height: 1;
    transform: translate(-4%, 0);
  }
  .accent {
    position: absolute;
    top: ${bleed ? 24 : 15}%; right: ${bleed ? 25 : 15}%;
    font-size: ${size * (bleed ? 0.17 : 0.22)}px; font-weight: 900; line-height: 1;
    color: #ffd166;
  }
</style>
<div class="icon"><div class="letter">D</div><div class="accent">ç</div></div>`;

const TARGETS = [
  { file: 'icon-192.png', size: 192, rounded: true, bleed: false },
  { file: 'icon-512.png', size: 512, rounded: true, bleed: false },
  { file: 'icon-maskable-512.png', size: 512, rounded: false, bleed: true },
  // iOS adds its own mask and does not support transparency.
  { file: 'apple-touch-icon.png', size: 180, rounded: false, bleed: false },
];

const browser = await chromium.launch();
for (const target of TARGETS) {
  const page = await browser.newPage({ viewport: { width: target.size, height: target.size } });
  await page.setContent(html(target.size, target));
  await page.locator('.icon').screenshot({ path: new URL(target.file, OUT).pathname.replace(/^\/(\w:)/, '$1'), omitBackground: true });
  await page.close();
}
await browser.close();
console.log(`wrote ${TARGETS.length} icons`);
