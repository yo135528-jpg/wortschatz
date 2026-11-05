/**
 * Validates src/data/cards.json against the zod schema and checks for likely duplicates.
 * Run: npm run validate
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseNotes, type Note } from '../src/domain/schema';

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
} catch (error) {
  console.error(`✗ ${(error as Error).message}`);
  process.exit(1);
}
