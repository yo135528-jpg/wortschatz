import { loadGrammar } from '../content';
import { grammarTopicsFor } from '../domain/links';
import { href } from './router';
import { clozeSolved, clozeWithGaps, parseCloze } from '../domain/cloze';
import { buildHeadword, typeLabelTr, type Headword } from '../domain/format';
import { PREFIX_MEANINGS, type FamilyMember, type VerbFamily } from '../domain/families';
import type { Direction, Note } from '../domain/schema';
import { h } from './dom';
import { icon } from './icons';
import { speakButton } from './tts';

function headwordView(headword: Headword, size: 'large' | 'small'): HTMLElement {
  return h(
    'div',
    { class: `headword headword-${size}`, 'data-testid': 'headword' },
    h(
      'div',
      { class: 'headword-line' },
      headword.article && h('span', { class: `article g-${headword.article}` }, headword.article),
      h(
        'span',
        { class: 'lemma' },
        headword.main,
        headword.plural && h('span', { class: 'plural' }, `, ${headword.plural}`),
      ),
      speakButton(headword.speech),
    ),
    headword.rektion && h('div', { class: 'rektion' }, headword.rektion),
    headword.forms && h('div', { class: 'forms' }, headword.forms),
  );
}

function examplesView(note: Note): HTMLElement {
  return h(
    'ul',
    { class: 'examples' },
    ...note.examples.map((example) =>
      h(
        'li',
        {},
        h('span', { class: 'example-de' }, example.de),
        speakButton(example.de),
        example.fromBook && h('span', { class: 'badge', title: 'Kitaptan' }, icon('book', { label: 'Kitaptan' })),
        example.tr && h('div', { class: 'example-tr', 'data-testid': 'example-tr' }, example.tr),
      ),
    ),
  );
}

/** tr2de back: the same gap sentence, solved, answers highlighted, with its translation. */
function clozeSolutionView(note: Note): HTMLElement | null {
  if (!note.cloze) return null;
  const sentence = parseCloze(note.cloze).map((part) =>
    part.kind === 'text' ? part.value : h('mark', { class: 'gap-answer' }, part.answer),
  );
  return h(
    'div',
    { class: 'cloze cloze-solution', 'data-testid': 'cloze-solution' },
    h('span', { class: 'cloze-de' }, ...sentence),
    speakButton(clozeSolved(note.cloze)),
    note.clozeTr && h('div', { class: 'example-tr', 'data-testid': 'cloze-tr' }, note.clozeTr),
  );
}

function grammarView(note: Note): HTMLElement | null {
  return note.grammarTr
    ? h('p', { class: 'grammar', 'data-testid': 'grammar' }, h('strong', {}, 'Dilbilgisi: '), note.grammarTr)
    : null;
}

function noteView(note: Note): HTMLElement | null {
  return note.note ? h('p', { class: 'note' }, icon('bulb'), note.note) : null;
}

/** Front side: the prompt. tr2de shows no German except the gap sentence. */
export function renderFront(note: Note, direction: Direction): HTMLElement {
  if (direction === 'de2tr') {
    return h(
      'div',
      { class: 'face-content' },
      h('div', { class: 'card-type' }, typeLabelTr(note.type)),
      headwordView(buildHeadword(note), 'large'),
    );
  }
  return h(
    'div',
    { class: 'face-content' },
    h('div', { class: 'card-type' }, note.hintTr),
    h('div', { class: 'meaning meaning-large', 'data-testid': 'meaning' }, note.meaningTr),
    note.cloze && h('div', { class: 'cloze', 'data-testid': 'cloze' }, clozeWithGaps(note.cloze)),
  );
}

/** Back side: the answer plus context. */
export function renderBack(note: Note, direction: Direction, family: VerbFamily | null = null, fold = true): HTMLElement {
  if (direction === 'de2tr') {
    return h(
      'div',
      { class: 'face-content' },
      headwordView(buildHeadword(note), 'small'),
      h('div', { class: 'meaning meaning-large', 'data-testid': 'meaning' }, note.meaningTr),
      examplesView(note),
      moreView(note, family, fold),
    );
  }
  return h(
    'div',
    { class: 'face-content' },
    h('div', { class: 'meaning meaning-small' }, note.meaningTr),
    headwordView(buildHeadword(note), 'large'),
    clozeSolutionView(note),
    examplesView(note),
    moreView(note, family, fold),
  );
}

const MORE_KEY = 'wortschatz.card-more-open';

/**
 * Grammar, notes, word family and grammar links fold into "Daha fazla", so the back shows the
 * meaning and examples first. The open/closed choice is remembered on this device.
 */
function moreView(note: Note, family: VerbFamily | null, fold: boolean): HTMLElement | null {
  const parts = [grammarView(note), noteView(note), familyView(note, family), grammarLinks(note)].filter(
    (part): part is HTMLElement => part !== null,
  );
  if (parts.length === 0) return null;
  if (!fold) return h('div', { class: 'card-more-body' }, ...parts);
  let open = false;
  try {
    open = localStorage.getItem(MORE_KEY) === '1';
  } catch {
    // Storage blocked: start closed.
  }
  const labels = [note.grammarTr && 'gramer', note.note && 'not', family && 'kelime ailesi'].filter(Boolean).join(' · ');
  return h(
    'details',
    {
      class: 'card-more',
      open,
      'data-testid': 'card-more',
      onclick: (event: Event) => event.stopPropagation(),
      ontoggle: (event: Event) => {
        try {
          localStorage.setItem(MORE_KEY, (event.currentTarget as HTMLDetailsElement).open ? '1' : '0');
        } catch {
          // Not remembered; fine.
        }
      },
    },
    h('summary', {}, 'Daha fazla', labels && h('span', { class: 'card-more-hint' }, labels)),
    h('div', { class: 'card-more-body' }, ...parts),
  );
}

/** Prefix highlighted: "**auf**·bauen", "**ver**arbeiten". */
export function memberWord(member: FamilyMember): HTMLElement {
  const { lemma } = member.note;
  if (!member.prefix) return h('span', { class: 'family-word' }, lemma);
  const cut = member.prefix.length;
  return h(
    'span',
    { class: 'family-word' },
    h('strong', { class: 'family-prefix' }, lemma.slice(0, cut)),
    member.separable ? '·' : '',
    lemma.slice(cut),
  );
}

/** "Aynı kökten": the prefixed relatives of a verb, with what this verb's prefix adds. */
function familyView(note: Note, family: VerbFamily | null): HTMLElement | null {
  if (!family) return null;
  const self = family.members.find((m) => m.note.id === note.id);
  const meaning = self?.prefix ? PREFIX_MEANINGS[self.prefix] : undefined;
  return h(
    'div',
    { class: 'family', 'data-testid': 'family' },
    h('div', { class: 'family-title' }, 'Aynı kökten · ', h('strong', {}, family.stem)),
    meaning && h('div', { class: 'family-hint' }, h('strong', {}, `${self!.prefix}-`), ` ${meaning}`),
    h(
      'ul',
      { class: 'family-list' },
      ...family.members.map((member) =>
        h(
          'li',
          { class: member.note.id === note.id ? 'is-current' : '' },
          memberWord(member),
          h('span', { class: 'family-meaning' }, member.note.meaningTr),
        ),
      ),
    ),
    h(
      'a',
      {
        class: 'family-more',
        href: href({ name: 'families', stem: family.stem }),
        // Inside a card: following the link must not flip it.
        onclick: (event: Event) => event.stopPropagation(),
      },
      'Tüm aileler',
    ),
  );
}

/**
 * "İlgili gramer" chips. Topic titles live in the lazily loaded grammar chunk,
 * so the chips are filled in once it is loaded.
 */
function grammarLinks(note: Note): HTMLElement | null {
  const ids = grammarTopicsFor(note);
  if (ids.length === 0) return null;
  const chips = h('div', { class: 'chips grammar-links', 'data-testid': 'grammar-links' });
  void loadGrammar().then((topics) => {
    const byId = new Map(topics.map((topic) => [topic.id, topic]));
    chips.replaceChildren(
      h('span', { class: 'muted small' }, 'İlgili gramer:'),
      ...ids.flatMap((id) => {
        const topic = byId.get(id);
        if (!topic) return [];
        return [
          h(
            'a',
            {
              class: 'chip',
              href: href({ name: 'grammar', id }),
              // Inside a card: following the link must not flip it.
              onclick: (event: Event) => event.stopPropagation(),
            },
            `${topic.level} · ${topic.titleDe}`,
          ),
        ];
      }),
    );
  });
  return chips;
}

/** Gender of the note, used for the colored card border. */
export function genderClass(note: Note): string {
  return note.type === 'noun' ? `card-g-${note.noun.gender}` : '';
}
