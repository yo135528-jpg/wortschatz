import { loadGrammar } from '../content';
import { grammarTopicsFor } from '../domain/links';
import { href } from './router';
import { clozeSolved, clozeWithGaps, parseCloze } from '../domain/cloze';
import { buildHeadword, typeLabelTr, type Headword } from '../domain/format';
import type { Direction, Note } from '../domain/schema';
import { h } from './dom';
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
        example.fromBook && h('span', { class: 'badge', title: 'Kitaptan' }, '📖'),
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
  return note.note ? h('p', { class: 'note' }, `💡 ${note.note}`) : null;
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
export function renderBack(note: Note, direction: Direction): HTMLElement {
  if (direction === 'de2tr') {
    return h(
      'div',
      { class: 'face-content' },
      headwordView(buildHeadword(note), 'small'),
      h('div', { class: 'meaning meaning-large', 'data-testid': 'meaning' }, note.meaningTr),
      examplesView(note),
      grammarView(note),
      noteView(note),
      grammarLinks(note),
    );
  }
  return h(
    'div',
    { class: 'face-content' },
    h('div', { class: 'meaning meaning-small' }, note.meaningTr),
    headwordView(buildHeadword(note), 'large'),
    clozeSolutionView(note),
    examplesView(note),
    grammarView(note),
    noteView(note),
    grammarLinks(note),
  );
}

/**
 * "📖 İlgili gramer" chips. Topic titles live in the lazily loaded grammar chunk,
 * so the chips are filled in once it is loaded.
 */
function grammarLinks(note: Note): HTMLElement | null {
  const ids = grammarTopicsFor(note);
  if (ids.length === 0) return null;
  const chips = h('div', { class: 'chips grammar-links', 'data-testid': 'grammar-links' });
  void loadGrammar().then((topics) => {
    const byId = new Map(topics.map((topic) => [topic.id, topic]));
    chips.replaceChildren(
      h('span', { class: 'muted small' }, '📖 İlgili gramer:'),
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
