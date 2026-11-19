/**
 * One consistent stroke-icon set (24×24, currentColor) instead of emoji, which look different
 * on every platform. Each entry is the inner SVG markup; all values are static, never user input.
 */
const PATHS = {
  speaker: '<path d="M11 5 6.5 9H3v6h3.5L11 19z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6"/><path d="M18.5 6a9 9 0 0 1 0 12"/>',
  flame:
    '<path d="M12 3c.4 3.2 5 5.4 5 10.2a5 5 0 0 1-10 0c0-1.9.9-3.4 2-4.4.2 1.5.9 2.5 1.9 3 .3-3-.4-5.6 1.1-8.8z"/>',
  book: '<path d="M12 6c-2-1.3-4.7-2-8-2v14c3.3 0 6 .7 8 2 2-1.3 4.7-2 8-2V4c-3.3 0-6 .7-8 2z"/><path d="M12 6v14"/>',
  bulb: '<path d="M9.5 18h5M10.5 21h3"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1.2 1.5 1.3 2.5h5.4c.1-1 .6-1.8 1.3-2.5A6 6 0 0 0 12 3z"/>',
  warning: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17v.3"/>',
  keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6.5 10h.01M10.2 10h.01M13.8 10h.01M17.5 10h.01M8 14h8"/>',
  sync: '<path d="M20 4v5h-5"/><path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M4 20v-5h5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15"/>',
  chat: '<path d="M4 5h16v11H9.5L4 20z"/><path d="M8 9.5h8M8 12.5h5"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5v7l5.5-3.5z"/>',
  pause: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  undo: '<path d="M8 6 4 10l4 4"/><path d="M4 10h10a5 5 0 0 1 0 10h-3"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  cards: '<rect x="4" y="6" width="13" height="14" rx="2"/><path d="M8 3h10a2 2 0 0 1 2 2v12"/><path d="M8 11h5M8 15h3"/>',
  shapes: '<circle cx="7.5" cy="8" r="3.5"/><rect x="13.5" y="4.5" width="7" height="7" rx="1.2"/><path d="M12 13.5 17 21H7z"/>',
  repeat: '<path d="m17 3 4 4-4 4"/><path d="M3 11V9a2 2 0 0 1 2-2h16"/><path d="m7 21-4-4 4-4"/><path d="M21 13v2a2 2 0 0 1-2 2H3"/>',
  link: '<g transform="rotate(-45 12 12)"><rect x="2.5" y="8.5" width="11" height="7" rx="3.5"/><rect x="10.5" y="8.5" width="11" height="7" rx="3.5"/></g>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  mountain: '<path d="m3 19 6.5-11 3.5 6 2.5-3.5L21 19z"/>',
  headphones:
    '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v6H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 14h-3v6h1.5a1.5 1.5 0 0 0 1.5-1.5z"/>',
  blank: '<path d="M4 7h16M4 12h4M16 12h4M4 17h16"/><path d="M10 13.5h4"/>',
  order: '<rect x="3" y="5" width="8" height="5" rx="1.5"/><rect x="13" y="5" width="8" height="5" rx="1.5"/><rect x="3" y="14" width="18" height="5" rx="1.5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/>',
  trophy:
    '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 5.5H5v1.5a3 3 0 0 0 3 3M16 5.5h3v1.5a3 3 0 0 1-3 3"/><path d="M12 13v4M8.5 20h7M10 17h4v3h-4z"/>',
} as const;

export type IconName = keyof typeof PATHS;

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Decorative by default (aria-hidden); pass a label when the icon stands alone. */
export function icon(name: IconName, options: { class?: string; label?: string } = {}): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', `icon i-${name}${options.class ? ` ${options.class}` : ''}`);
  if (options.label) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', options.label);
  } else {
    svg.setAttribute('aria-hidden', 'true');
  }
  svg.innerHTML = PATHS[name];
  return svg;
}
