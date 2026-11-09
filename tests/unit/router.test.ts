import { describe, expect, it } from 'vitest';
import { parseRoute, routeHash, tabOf, type Route } from '../../src/ui/router';

describe('router', () => {
  const routes: Route[] = [
    { name: 'today' },
    { name: 'study' },
    { name: 'review' },
    { name: 'drill', kind: 'artikel' },
    { name: 'words', id: null },
    { name: 'words', id: 'entscheidung-86e2' },
    { name: 'grammar', id: null },
    { name: 'grammar', id: 'passiv' },
    { name: 'street', id: 'fluchen' },
    { name: 'search', query: 'Bock haben' },
    { name: 'progress' },
    { name: 'settings' },
  ];

  it('round-trips every route through the hash', () => {
    for (const route of routes) expect(parseRoute(routeHash(route))).toEqual(route);
  });

  it('falls back to today for empty or unknown hashes', () => {
    expect(parseRoute('')).toEqual({ name: 'today' });
    expect(parseRoute('#/nope')).toEqual({ name: 'today' });
  });

  it('maps routes to bottom-bar tabs', () => {
    expect(tabOf({ name: 'review' })).toBe('study');
    expect(tabOf({ name: 'grammar', id: 'passiv' })).toBe('library');
    expect(tabOf({ name: 'settings' })).toBeNull();
  });
});
