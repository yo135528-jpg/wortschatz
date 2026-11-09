import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { pickOfDay } from '../../src/domain/daily';
import {
  alternatives,
  artikelQuestions,
  dictationQuestions,
  grammarQuestions,
  pickRound,
  rektionQuestions,
  streetQuestions,
  typedAnswers,
  verbQuestions,
  writingQuestions,
} from '../../src/domain/drills';
import { parseGrammar } from '../../src/domain/grammar';
import { parseNotes } from '../../src/domain/schema';
import { parseStreet } from '../../src/domain/street';

const notes = parseNotes(JSON.parse(readFileSync(new URL('../fixtures/notes.json', import.meta.url), 'utf8')));
const byId = (id: string) => notes.find((note) => note.id === id)!;
const seeded = () => {
  let seed = 1;
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
};

describe('note drills', () => {
  it('artikel: one choice question per noun', () => {
    const questions = artikelQuestions(notes);
    expect(questions.every((q) => q.fields[0]!.kind === 'choice')).toBe(true);
    const entscheidung = questions.find((q) => q.id === 'entscheidung-86e2')!;
    expect(entscheidung.title).toBe('Entscheidung');
    expect(entscheidung.fields[0]).toMatchObject({ answer: 'die' });
  });

  it('verben: asks Präteritum, Partizip II and the auxiliary', () => {
    const question = verbQuestions(notes).find((q) => q.id === 'teilnehmen-2109')!;
    expect(question.fields.map((f) => f.label)).toEqual(['Präteritum (er/sie)', 'Partizip II', 'Yardımcı fiil']);
    expect(question.fields[0]).toMatchObject({ answers: ['nahm teil'] });
  });

  it('accepts each form of a verb with two forms', () => {
    expect(alternatives('sendete/sandte')).toEqual(['sendete/sandte', 'sendete', 'sandte']);
    expect(alternatives('nahm teil')).toEqual(['nahm teil']);
  });

  it('rektion: only notes with a preposition', () => {
    const question = rektionQuestions(notes).find((q) => q.id === 'entscheiden-bb52')!;
    expect(question.fields[0]).toMatchObject({ answers: ['für'] });
    expect(question.fields[1]).toMatchObject({ answer: 'Akk' });
  });

  it('schreiben: nouns need the article, reflexive verbs accept "sich"', () => {
    expect(typedAnswers(byId('entscheidung-86e2'))).toEqual(['die Entscheidung']);
    expect(typedAnswers(byId('entscheiden-bb52'))).toEqual(['sich entscheiden', 'entscheiden']);
    expect(writingQuestions(notes)).toHaveLength(notes.length);
  });

  it('dikte: one question per example sentence', () => {
    const questions = dictationQuestions(notes);
    expect(questions.length).toBeGreaterThan(0);
    expect(questions.every((q) => q.audioOnly && q.audio === q.solution)).toBe(true);
  });
});

describe('content drills', () => {
  it('gramer: bold parts of examples become numbered gaps', () => {
    const [question] = grammarQuestions(
      parseGrammar([
        {
          id: 'perfekt',
          level: 'A2',
          category: 'verb',
          titleDe: 'Perfekt',
          titleTr: 'Geçmiş',
          summary: 'Kurz.',
          blocks: [{ type: 'examples', items: [{ de: 'Ich **habe** Pizza **gegessen**.', tr: 'Pizza yedim.' }] }],
        },
      ]),
    );
    expect(question!.sentence).toBe('Ich (1) ___ Pizza (2) ___.');
    expect(question!.fields.map((f) => (f.kind === 'text' ? f.answers[0] : ''))).toEqual(['habe', 'gegessen']);
    expect(question!.solution).toBe('Ich habe Pizza gegessen.');
  });

  it('sokak: four distinct options including the right one', () => {
    const topics = parseStreet([
      {
        id: 'x',
        icon: '💬',
        titleTr: 'X',
        titleDe: 'X',
        intro: 'Kurz.',
        blocks: [
          {
            type: 'phrases',
            items: ['eins', 'zwei', 'drei', 'vier', 'fünf'].map((de, i) => ({ de, tr: `anlam ${i}`, register: 'alltag' as const })),
          },
        ],
      },
    ]);
    const questions = streetQuestions(topics, seeded());
    for (const question of questions) {
      const field = question.fields[0]!;
      if (field.kind !== 'choice') throw new Error('expected choice');
      expect(new Set(field.options).size).toBe(4);
      expect(field.options).toContain(field.answer);
    }
  });
});

describe('helpers', () => {
  it('pickRound caps the round and keeps items unique', () => {
    const round = pickRound(writingQuestions(notes), 3, seeded());
    expect(round).toHaveLength(3);
    expect(new Set(round.map((q) => q.id)).size).toBe(3);
  });

  it('pickOfDay is stable within a day and handles empty lists', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    expect(pickOfDay(items, '2026-11-09')).toBe(pickOfDay(items, '2026-11-09'));
    expect(pickOfDay([], '2026-11-09')).toBeNull();
  });
});
