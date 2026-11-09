import { ALL_SCOPE, scopeOptions, type Scope } from '../domain/scope';
import type { Note } from '../domain/schema';
import { h } from './dom';

/** <select> for "all / chapter / page", shared by the review and the drills. */
export function scopeSelect(
  notes: Iterable<Note>,
  value: Scope,
  onChange: (scope: Scope) => void,
  testId: string,
): HTMLSelectElement {
  const { chapters, pages } = scopeOptions(notes);
  const option = (scope: Scope, label: string) => h('option', { value: scope, selected: scope === value }, label);
  return h(
    'select',
    {
      class: 'scope-select',
      'aria-label': 'Hangi kelimeler?',
      'data-testid': testId,
      onchange: (event: Event) => onChange((event.target as HTMLSelectElement).value),
    },
    option(ALL_SCOPE, 'Tüm kelimeler'),
    h('optgroup', { label: 'Bölüm' }, ...chapters.map((chapter) => option(`c:${chapter}`, chapter))),
    pages.length > 1 ? h('optgroup', { label: 'Sayfa' }, ...pages.map((page) => option(`p:${page}`, page))) : null,
  );
}
