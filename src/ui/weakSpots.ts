import { loadGrammar } from '../content';
import { weakSkills, type WeakSkill } from '../domain/skills';
import { h } from './dom';
import { href, type Route } from './router';
import { readSkillStats } from './skillStore';

const SKILL_LABELS: Record<string, { label: string; route: Route }> = {
  artikel: { label: 'der · die · das', route: { name: 'drill', kind: 'artikel' } },
  verben: { label: 'Fiil çekimleri', route: { name: 'drill', kind: 'verben' } },
  rektion: { label: 'Fiil + edat', route: { name: 'drill', kind: 'rektion' } },
  'adjektiv:none': { label: 'Sıfat çekimi: artikelsiz', route: { name: 'drill', kind: 'adjektiv' } },
  'adjektiv:definite': { label: 'Sıfat çekimi: der/die/das ile', route: { name: 'drill', kind: 'adjektiv' } },
  'adjektiv:indefinite': { label: 'Sıfat çekimi: ein/kein ile', route: { name: 'drill', kind: 'adjektiv' } },
};

export interface WeakSpot extends WeakSkill {
  label: string;
  route: Route;
}

/** Weak skills with a readable name and the screen where they can be fixed. */
export async function loadWeakSpots(limit = 3): Promise<WeakSpot[]> {
  const weak = weakSkills(readSkillStats(), limit);
  if (weak.length === 0) return [];
  const needsGrammar = weak.some((entry) => entry.skill.startsWith('gramer:'));
  const topics = needsGrammar ? await loadGrammar() : [];
  return weak.flatMap((entry) => {
    if (entry.skill.startsWith('gramer:')) {
      const topic = topics.find((t) => t.id === entry.skill.slice('gramer:'.length));
      return topic ? [{ ...entry, label: topic.titleDe, route: { name: 'grammar', id: topic.id } as Route }] : [];
    }
    const known = SKILL_LABELS[entry.skill];
    return known ? [{ ...entry, ...known }] : [];
  });
}

/** "Zayıf noktaların" list; stays empty (and hidden) until there is enough practice data. */
export function weakSpotsPanel(): HTMLElement {
  const panel = h('section', { class: 'weak-spots', 'data-testid': 'weak-spots', hidden: true });
  void loadWeakSpots().then((spots) => {
    if (spots.length === 0) return;
    panel.hidden = false;
    panel.replaceChildren(
      h('h2', { class: 'section-title' }, 'Zayıf noktaların'),
      h('p', { class: 'muted small section-sub' }, 'Antrenmanlardaki son cevaplarına göre. %80 üstüne çıkınca listeden düşer.'),
      h(
        'ul',
        { class: 'weak-list' },
        ...spots.map((spot) =>
          h(
            'li',
            {},
            h(
              'a',
              { class: 'weak-item', href: href(spot.route) },
              h('span', { class: 'weak-label' }, spot.label),
              h(
                'span',
                { class: 'weak-meter', role: 'img', 'aria-label': `%${Math.round(spot.accuracy * 100)} doğru` },
                h('span', { class: 'weak-fill', style: `width:${Math.round(spot.accuracy * 100)}%` }),
              ),
              h('span', { class: 'weak-value' }, `%${Math.round(spot.accuracy * 100)}`),
            ),
          ),
        ),
      ),
    );
  });
  return panel;
}
