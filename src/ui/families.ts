import type { App } from '../app';
import { familiesFor, PREFIX_MEANINGS, type VerbFamily } from '../domain/families';
import { memberWord } from './cardFaces';
import { h } from './dom';
import { href } from './router';

/** Library screen: every verb family from the learner's cards, prefixes highlighted. */
export class FamiliesView {
  private query = '';
  private readonly list: HTMLElement;

  constructor(
    private readonly app: App,
    root: HTMLElement,
  ) {
    const search = h('input', {
      type: 'search',
      class: 'search',
      placeholder: 'Ara: kök, fiil, anlam…',
      'aria-label': 'Ara',
      oninput: (event: Event) => {
        this.query = (event.target as HTMLInputElement).value.trim().toLocaleLowerCase('de');
        this.refresh();
      },
    });
    this.list = h('div', { class: 'family-page', 'data-testid': 'family-page' });
    root.append(
      h('h2', { class: 'section-title' }, 'Fiil aileleri'),
      h(
        'p',
        { class: 'muted small' },
        'Kartlarındaki fiiller kökleriyle gruplandı. Ön ekin anlamını bilmek, aynı kökten fiilleri ayırt etmeyi kolaylaştırır. ',
        h('a', { href: href({ name: 'grammar', id: 'praefixe-trennbar' }) }, 'Ön ekler ne katar?'),
      ),
      search,
      this.list,
    );
  }

  /** Called by the router; a stem scrolls to its family. */
  show(stem: string | null): void {
    this.refresh(stem);
    if (stem) this.list.querySelector(`[data-stem="${CSS.escape(stem)}"]`)?.scrollIntoView({ block: 'start' });
  }

  refresh(highlight: string | null = null): void {
    const families = [...familiesFor(this.app.notes).values()]
      .filter((family) => this.matches(family))
      .sort((a, b) => b.members.length - a.members.length || a.stem.localeCompare(b.stem, 'de'));
    this.list.replaceChildren(
      ...(families.length ? families.map((family) => this.renderFamily(family, family.stem === highlight)) : [h('p', { class: 'muted' }, 'Sonuç yok.')]),
    );
  }

  private matches(family: VerbFamily): boolean {
    if (!this.query) return true;
    return (
      family.stem.includes(this.query) ||
      family.members.some(
        (m) => m.note.lemma.toLowerCase().includes(this.query) || m.note.meaningTr.toLocaleLowerCase('tr').includes(this.query),
      )
    );
  }

  private renderFamily(family: VerbFamily, highlighted: boolean): HTMLElement {
    return h(
      'section',
      { class: `family family-card ${highlighted ? 'is-highlighted' : ''}`, 'data-stem': family.stem, 'data-testid': 'family-card' },
      h('div', { class: 'family-title' }, h('strong', {}, family.stem), h('span', { class: 'chip-count' }, String(family.members.length))),
      h(
        'ul',
        { class: 'family-list' },
        ...family.members.map((member) =>
          h(
            'li',
            {},
            h('a', { href: href({ name: 'words', id: member.note.id }) }, memberWord(member)),
            h('span', { class: 'family-meaning' }, member.note.meaningTr),
            member.prefix && PREFIX_MEANINGS[member.prefix] && h('span', { class: 'family-prefix-tr' }, `${member.prefix}-: ${PREFIX_MEANINGS[member.prefix]}`),
          ),
        ),
      ),
    );
  }
}
