/**
 * Validates src/data/cards.json (plus the grammar reference and street German) against the zod schemas and checks for likely duplicates.
 * Run: npm run validate
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { NotesFileSchema, parseNotes, type Note } from '../src/domain/schema';
import { STORIES } from '../src/data/stories';
import { glossaryEntry, parseStories, storyLemmas, storyNote } from '../src/domain/stories';
import { GRAMMAR_TOPICS } from '../src/data/grammar';
import { parseGrammar } from '../src/domain/grammar';
import { REDEMITTEL } from '../src/data/redemittel';
import { STREET_TOPICS } from '../src/data/street';
import { parseRedemittel } from '../src/domain/redemittel';
import { parseStreet, topicPhrases } from '../src/domain/street';

const file = fileURLToPath(new URL('../src/data/cards.json', import.meta.url));

function duplicateKey(note: Note): string {
  const gender = note.type === 'noun' ? note.noun.gender : '';
  return `${note.type}|${gender}|${note.lemma.toLowerCase()}`;
}

try {
  const notes = parseNotes(JSON.parse(readFileSync(file, 'utf8')));

  const seen = new Map<string, string>();
  const warnings: string[] = [];
  for (const note of notes) {
    const key = duplicateKey(note);
    const other = seen.get(key);
    if (other) warnings.push(`possible duplicate: "${note.id}" and "${other}" (${note.lemma})`);
    seen.set(key, note.id);
  }

  if (warnings.length) {
    console.error(`✗ ${warnings.length} duplicate(s) found:\n  ${warnings.join('\n  ')}`);
    process.exit(1);
  }
  const cardCount = notes.reduce((sum, note) => sum + note.directions.length, 0);
  console.log(`✓ cards.json is valid: ${notes.length} notes, ${cardCount} cards`);

  const topics = parseGrammar(GRAMMAR_TOPICS);
  console.log(`✓ grammar is valid: ${topics.length} topics`);

  const street = parseStreet(STREET_TOPICS);
  const phraseCount = street.reduce((sum, topic) => sum + topicPhrases(topic).length, 0);
  console.log(`✓ street German is valid: ${street.length} topics, ${phraseCount} phrases`);

  const redemittel = parseRedemittel(REDEMITTEL);
  const redemittelCount = redemittel.reduce((sum, group) => sum + group.items.length, 0);
  console.log(`✓ Redemittel are valid: ${redemittel.length} groups, ${redemittelCount} phrases`);

  // Stories: every linked word must be a card or a glossary entry, and glossary entries must be valid cards.
  const stories = parseStories(STORIES);
  const lemmas = new Set(notes.map((note) => note.lemma.toLowerCase()));
  const storyErrors: string[] = [];
  for (const story of stories) {
    for (const lemma of storyLemmas(story)) {
      if (!lemmas.has(lemma.toLowerCase()) && !glossaryEntry(story, lemma)) {
        storyErrors.push(`${story.id}: "${lemma}" is neither a card nor in the glossary`);
      }
    }
    try {
      NotesFileSchema.parse(story.glossary.map((entry) => storyNote(story, entry, '2026-01-01')));
    } catch (error) {
      storyErrors.push(`${story.id} glossary: ${(error as Error).message}`);
    }
  }
  if (storyErrors.length) {
    console.error(`✗ stories:\n  ${storyErrors.join('\n  ')}`);
    process.exit(1);
  }
  console.log(`✓ stories are valid: ${stories.length} stories`);
} catch (error) {
  console.error(`✗ ${(error as Error).message}`);
  process.exit(1);
}
