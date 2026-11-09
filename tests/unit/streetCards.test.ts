import { describe, expect, it } from 'vitest';
import { STREET_TOPICS } from '../../src/data/street';
import { clozeAnswers } from '../../src/domain/cloze';
import { parseNotes } from '../../src/domain/schema';
import { parseStreet, topicPhrases } from '../../src/domain/street';
import { fullCloze, phraseKey, streetNote, streetNotes } from '../../src/domain/streetCards';

const topics = parseStreet(STREET_TOPICS);

describe('street cards', () => {
  it('gaps every word and keeps punctuation outside', () => {
    expect(fullCloze('Ich bin pleite.')).toBe('[Ich] [bin] [pleite].');
    expect(fullCloze("Haste mal 'n Moment?")).toBe("[Haste] [mal] ['n] [Moment]?");
    expect(clozeAnswers(fullCloze('Na, alles klar?'))).toEqual(['Na', 'alles', 'klar']);
  });

  it('turns every real phrase into a valid note with a stable id', () => {
    const notes = topics.flatMap((topic) => topicPhrases(topic).map((phrase) => streetNote(topic, phrase, '2026-11-09')));
    // The full notes-file schema (cloze rules, duplicate ids) must accept them.
    expect(() => parseNotes(notes)).not.toThrow();
    const topic = topics[0]!;
    const phrase = topicPhrases(topic)[0]!;
    expect(streetNote(topic, phrase, '2026-11-09').id).toBe(streetNote(topic, phrase, '2027-01-01').id);
  });

  it('rebuilds only the stored phrases', () => {
    const topic = topics[0]!;
    const phrase = topicPhrases(topic)[1]!;
    const notes = streetNotes(topics, [phraseKey(topic, phrase), 'gone|Weg'], '2026-11-09');
    expect(notes).toHaveLength(1);
    expect(notes[0]!.meaningTr).toBe(phrase.tr);
  });
});
