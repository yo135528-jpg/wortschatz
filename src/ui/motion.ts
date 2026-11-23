/**
 * Small motion helpers that make studying feel alive: haptics, confetti, number count-up.
 * Everything respects prefers-reduced-motion and degrades to nothing when unsupported.
 */

export function reducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Short vibration on supporting phones (Android); silently ignored elsewhere. */
export function haptic(pattern: number | number[] = 8): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Not allowed (e.g. before a user gesture): no feedback, no error.
  }
}

const CONFETTI_COLORS = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#0a84ff', '#af52de'];

/** A one-shot confetti burst from the bottom centre, drawn on a temporary canvas. */
export function confetti(pieces = 90): void {
  if (reducedMotion() || typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti';
  canvas.setAttribute('aria-hidden', 'true');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);
  const parts = Array.from({ length: pieces }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 80,
    y: innerHeight * 0.75,
    vx: (Math.random() - 0.5) * 11,
    vy: -(Math.random() * 11 + 9),
    size: Math.random() * 6 + 5,
    rot: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.3,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
  }));
  const start = performance.now();
  const frame = (time: number) => {
    const elapsed = time - start;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.35;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.spin;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - elapsed / 2200);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (elapsed < 2200) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

/** Animates the text of an element from 0 to `to` (integers). */
export function countUp(element: HTMLElement, to: number, duration = 700): void {
  if (reducedMotion() || to <= 0) {
    element.textContent = String(to);
    return;
  }
  const start = performance.now();
  const step = (time: number) => {
    const t = Math.min(1, (time - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    element.textContent = String(Math.round(to * eased));
    if (t < 1) requestAnimationFrame(step);
  };
  element.textContent = '0';
  requestAnimationFrame(step);
}

/** Resolves after `ms`, or immediately with reduced motion. */
export function pause(ms: number): Promise<void> {
  return reducedMotion() ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}
