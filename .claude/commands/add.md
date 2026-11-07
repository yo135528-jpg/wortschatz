---
description: Add German words (optionally with book sentences) as flashcard notes to src/data/cards.json
argument-hint: Wort1, Wort2, "Satz aus dem Buch ..." [Kapitel N]
allowed-tools: Read, Edit, Bash(npm run validate), Bash(npm run new-id:*)
---

Add the following words to `src/data/cards.json`:

$ARGUMENTS

Follow the "HOW TO WRITE CARDS" rules in `CLAUDE.md` exactly. Steps:

1. Parse the input: words/expressions are comma-separated; text in quotes is a sentence from the book. Match each sentence to the word it contains. If a chapter is given (e.g. "Kapitel 3"), use it for `source` and tags; otherwise reuse the `source` of the most recent note.
2. Read `src/data/cards.json` and check every word for duplicates or variants (same lemma, same word family, existing expression). Enrich existing notes instead of duplicating; never change an existing `id`.
3. For each new note generate the id with `npm run new-id -- "<lemma>" <type> [gender]`.
4. Append the notes (keep existing order), then run `npm run validate` and fix every error.
5. Reply in Turkish with a SHORT summary table only, no long explanations:

| | Kart (DE) | Türkçe | Not |
|---|---|---|---|
| ➕ | die Entscheidung, -en | karar | |
| ✏️ | sich entscheiden für + Akk | ... | kitap cümlesi eklendi |

   (➕ = new note, ✏️ = enriched existing note). After the table, list anything you were unsure about (e.g. gender, plural, which meaning the book means) in one line each.
6. Do NOT commit. Remind the user that the cards appear after reload (dev) or after deploy.
