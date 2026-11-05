/**
 * Prints a stable note id.
 * Usage: npm run new-id -- "<lemma>" <type> [gender]
 * Example: npm run new-id -- "Entscheidung" noun die
 */
import { createNoteId } from '../src/domain/id';

const [lemma, type, gender] = process.argv.slice(2);
if (!lemma || !type) {
  console.error('Usage: npm run new-id -- "<lemma>" <type> [gender]');
  process.exit(1);
}
console.log(createNoteId(lemma, type, gender));
