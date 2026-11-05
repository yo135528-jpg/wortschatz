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

function examplesView(note: Note, withTranslation: boolean): HTMLElement {
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
        withTranslation && example.tr && h('div', { class: 'example-tr' }, example.tr),
      ),
    ),
  );
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
    note.cloze && h('div', { class: 'cloze' }, note.cloze),
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
      examplesView(note, true),
      noteView(note),
    );
  }
  return h(
    'div',
    { class: 'face-content' },
    h('div', { class: 'meaning meaning-small' }, note.meaningTr),
    headwordView(buildHeadword(note), 'large'),
    examplesView(note, false),
    noteView(note),
  );
}

/** Gender of the note, used for the colored card border. */
export function genderClass(note: Note): string {
  return note.type === 'noun' ? `card-g-${note.noun.gender}` : '';
}
