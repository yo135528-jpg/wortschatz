/**
 * Hash router: every screen has its own URL (#/library/grammar/passiv), so the
 * phone's back button and reloads work, and screens can link to each other.
 */
export type Route =
  | { name: 'today' }
  | { name: 'study' }
  | { name: 'review' }
  | { name: 'drill'; kind: string }
  | { name: 'words'; id: string | null }
  | { name: 'grammar'; id: string | null }
  | { name: 'street'; id: string | null }
  | { name: 'phrases'; id: string | null }
  | { name: 'search'; query: string }
  | { name: 'progress' }
  | { name: 'settings' };

export type RouteName = Route['name'];

/** Bottom-bar tab that is highlighted for a route. */
export type Tab = 'today' | 'study' | 'library' | 'progress';

export function tabOf(route: Route): Tab | null {
  switch (route.name) {
    case 'today':
    case 'search':
      return 'today';
    case 'study':
    case 'review':
    case 'drill':
      return 'study';
    case 'words':
    case 'grammar':
    case 'street':
    case 'phrases':
      return 'library';
    case 'progress':
      return 'progress';
    case 'settings':
      return null;
  }
}

export function parseRoute(hash: string): Route {
  const [path = '', query = ''] = hash.replace(/^#\/?/, '').split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const [section, sub, id] = parts;
  switch (section) {
    case 'study':
      if (sub === 'review') return { name: 'review' };
      if (sub) return { name: 'drill', kind: sub };
      return { name: 'study' };
    case 'library':
      if (sub === 'grammar') return { name: 'grammar', id: id ?? null };
      if (sub === 'street') return { name: 'street', id: id ?? null };
      if (sub === 'redemittel') return { name: 'phrases', id: id ?? null };
      return { name: 'words', id: sub === 'words' ? (id ?? null) : null };
    case 'search':
      return { name: 'search', query: new URLSearchParams(query).get('q') ?? '' };
    case 'progress':
      return { name: 'progress' };
    case 'settings':
      return { name: 'settings' };
    default:
      return { name: 'today' };
  }
}

export function routeHash(route: Route): string {
  switch (route.name) {
    case 'today':
      return '#/';
    case 'study':
      return '#/study';
    case 'review':
      return '#/study/review';
    case 'drill':
      return `#/study/${encodeURIComponent(route.kind)}`;
    case 'words':
      return route.id ? `#/library/words/${encodeURIComponent(route.id)}` : '#/library/words';
    case 'grammar':
      return route.id ? `#/library/grammar/${encodeURIComponent(route.id)}` : '#/library/grammar';
    case 'street':
      return route.id ? `#/library/street/${encodeURIComponent(route.id)}` : '#/library/street';
    case 'phrases':
      return route.id ? `#/library/redemittel/${encodeURIComponent(route.id)}` : '#/library/redemittel';
    case 'search':
      return route.query ? `#/search?q=${encodeURIComponent(route.query)}` : '#/search';
    case 'progress':
      return '#/progress';
    case 'settings':
      return '#/settings';
  }
}

export function navigate(route: Route): void {
  location.hash = routeHash(route);
}

/** Replaces the current history entry (used while typing in a search box). */
export function replaceRoute(route: Route): void {
  history.replaceState(null, '', routeHash(route));
}

/** Link-like button attributes: <a href="#/..."> keeps native behaviour (long-press, new tab). */
export function href(route: Route): string {
  return routeHash(route);
}
