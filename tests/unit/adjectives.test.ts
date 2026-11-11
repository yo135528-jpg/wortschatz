import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  adjectiveEnding,
  articleQuestions,
  explainEnding,
  noArticleQuestions,
  NO_ARTICLE_PHRASES,
} from '../../src/domain/adjectives';
import { parseNotes } from '../../src/domain/schema';
import { accuracy, recordAnswer, weakSkills, WINDOW } from '../../src/domain/skills';

const notes = parseNotes(JSON.parse(readFileSync(new URL('../fixtures/notes.json', import.meta.url), 'utf8')));

describe('adjective endings', () => {
  it('without an article the adjective takes the article ending', () => {
    expect(adjectiveEnding('none', 'Dat', 'das')).toBe('em');
    expect(adjectiveEnding('none', 'Dat', 'die')).toBe('er');
    expect(adjectiveEnding('none', 'Akk', 'der')).toBe('en');
    expect(adjectiveEnding('none', 'Nom', 'das')).toBe('es');
    // Genitive der/das is the exception: the noun carries the -s.
    expect(adjectiveEnding('none', 'Gen', 'das')).toBe('en');
  });

  it('after an article: -e in the plain forms, -en everywhere else', () => {
    expect(adjectiveEnding('definite', 'Nom', 'der')).toBe('e');
    expect(adjectiveEnding('definite', 'Akk', 'der')).toBe('en');
    expect(adjectiveEnding('definite', 'Dat', 'die')).toBe('en');
    expect(adjectiveEnding('indefinite', 'Nom', 'der')).toBe('er');
    expect(adjectiveEnding('indefinite', 'Akk', 'das')).toBe('es');
    expect(adjectiveEnding('indefinite', 'Nom', 'pl')).toBe('en');
  });

  it('builds the curated phrases with the right solution', () => {
    const question = noArticleQuestions().find((q) => q.title === 'mit groß___ Interesse')!;
    expect(question.fields[0]).toMatchObject({ kind: 'choice', answer: '-em' });
    expect(question.solution).toBe('mit großem Interesse');
    expect(question.skill).toBe('adjektiv:none');
    expect(explainEnding('none', 'Dat', 'das')).toContain('dem → -em');
  });

  it('every curated phrase has exactly one gap', () => {
    for (const phrase of NO_ARTICLE_PHRASES) expect(phrase.text.split('*')).toHaveLength(2);
  });

  it('builds der/ein phrases from the nouns of the notes', () => {
    const questions = articleQuestions(notes, () => 0);
    const entscheidung = questions.find((q) => q.id.endsWith(':entscheidung-86e2'))!;
    // random() = 0 → definite article, nominative, first adjective and frame.
    expect(entscheidung.title).toBe('Das ist die neu___ Entscheidung.');
    expect(entscheidung.solution).toBe('Das ist die neue Entscheidung.');
    expect(questions.every((q) => q.title.includes('___'))).toBe(true);
  });
});

describe('skill stats', () => {
  const now = new Date('2026-11-11T10:00:00Z');

  it('counts answers and finds weak skills', () => {
    let stats = {};
    for (let i = 0; i < 6; i++) stats = recordAnswer(stats, 'adjektiv:none', i < 2, now);
    for (let i = 0; i < 6; i++) stats = recordAnswer(stats, 'artikel', true, now);
    for (let i = 0; i < 2; i++) stats = recordAnswer(stats, 'verben', false, now);
    // artikel is strong, verben has too few answers yet.
    expect(weakSkills(stats).map((w) => w.skill)).toEqual(['adjektiv:none']);
  });

  it('forgets old mistakes: only the recent window counts', () => {
    let stats = {};
    for (let i = 0; i < 10; i++) stats = recordAnswer(stats, 'rektion', false, now);
    for (let i = 0; i < 60; i++) stats = recordAnswer(stats, 'rektion', true, now);
    const stat = (stats as Record<string, { right: number; wrong: number; last: string }>).rektion!;
    expect(stat.right + stat.wrong).toBeLessThanOrEqual(WINDOW + 1);
    expect(accuracy(stat)).toBeGreaterThan(0.8);
  });
});
