/**
 * Validates src/data/cards.json (plus the grammar reference and street German) against the zod schemas and checks for likely duplicates.
 * Run: npm run validate
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseNotes, type Note } from '../src/domain/schema';
import { GRAMMAR_TOPICS } from '../src/data/grammar';
import { parseGrammar } from '../src/domain/grammar';
import { STREET_TOPICS } from '../src/data/street';
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
} catch (error) {
  console.error(`✗ ${(error as Error).message}`);
  process.exit(1);
}
