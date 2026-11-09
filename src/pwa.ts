/**
 * Registers the service worker (public/sw.js) in production builds, so the app
 * can be installed on the phone and opened offline.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./sw.js').catch((error: unknown) => {
    console.warn('Service worker registration failed', error);
  });
}
