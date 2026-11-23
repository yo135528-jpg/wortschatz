import { describe, expect, it } from 'vitest';
import { STORIES } from '../../src/data/stories';
import { isStoryKey, parseStories, plainSentence, segments, storyKey, storyLemmas, storyNote, storyNotes } from '../../src/domain/stories';

const stories = parseStories(STORIES);
const story = stories[0]!;

describe('story text', () => {
  it('splits linked words from plain text', () => {
    expect(segments('Er [pendelt|pendeln] nach [Köln].')).toEqual([
      { kind: 'text', value: 'Er ' },
      { kind: 'word', surface: 'pendelt', lemma: 'pendeln' },
      { kind: 'text', value: ' nach ' },
      { kind: 'word', surface: 'Köln', lemma: 'Köln' },
      { kind: 'text', value: '.' },
    ]);
  });

  it('gives the plain sentence for speech', () => {
    expect(plainSentence('Er [pendelt|pendeln] heute.')).toBe('Er pendelt heute.');
  });

  it('lists each lemma once', () => {
    const lemmas = storyLemmas(story);
    expect(new Set(lemmas).size).toBe(lemmas.length);
    expect(lemmas).toContain('pendeln');
  });
});

describe('story cards', () => {
  it('builds a stable note from a glossary entry', () => {
    const entry = story.glossary[0]!;
    const a = storyNote(story, entry, '2026-11-23');
    const b = storyNote(story, entry, '2026-12-01');
    expect(a.id).toBe(b.id);
    expect(a.tags).toContain('okuma');
  });

  it('rebuilds only the stored keys', () => {
    const lemma = String(story.glossary[0]!.lemma);
    const key = storyKey(story, lemma);
    expect(isStoryKey(key)).toBe(true);
    expect(storyNotes(stories, [key, 'other|x'], '2026-11-23').map((n) => n.lemma)).toEqual([lemma]);
  });
});
